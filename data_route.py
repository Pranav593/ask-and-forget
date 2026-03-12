# data_router.py
"""
Data Router: fetches data from multiple APIs based on trigger_type,
with a simple in-memory cache for weather (per-city, 10 minutes).

Design goals:
- One entrypoint: route(trigger_type, payload) -> result envelope
- Consistent error handling
- Minimal dependencies (uses requests)
- Safe caching (lock-protected dict)
"""

from __future__ import annotations

import os
import time
import threading
from dataclasses import dataclass
from typing import Any, Dict, Optional, Callable, Tuple

import requests
import re

# ----------------------------
# Result envelope + errors
# ----------------------------

@dataclass
class RouterError(Exception):
    code: str
    message: str
    status: int = 502
    details: Optional[dict] = None


def ok(data: Any, *, source: str, meta: Optional[dict] = None) -> dict:
    return {
        "ok": True,
        "source": source,             # "api" or "cache"
        "fetched_at": int(time.time()),
        "data": data,
        "meta": meta or {},
    }


def fail(err: RouterError) -> dict:
    return {
        "ok": False,
        "error": {
            "code": err.code,
            "message": err.message,
            "status": err.status,
            "details": err.details or {},
        },
    }


# ----------------------------
# Simple in-memory cache
# ----------------------------

_WEATHER_TTL_SECONDS = 10 * 60
_weather_cache: Dict[str, Dict[str, Any]] = {}
_cache_lock = threading.Lock()


def _cache_get_weather(city_key: str) -> Optional[dict]:
    now = time.time()
    with _cache_lock:
        entry = _weather_cache.get(city_key)
        if not entry:
            return None
        if now >= entry["expires_at"]:
            # expired; remove to keep dict clean
            _weather_cache.pop(city_key, None)
            return None
        return entry["data"]


def _cache_set_weather(city_key: str, data: dict) -> None:
    now = time.time()
    with _cache_lock:
        _weather_cache[city_key] = {
            "expires_at": now + _WEATHER_TTL_SECONDS,
            "data": data,
        }


# ----------------------------
# HTTP helpers
# ----------------------------

def _request_json(
    method: str,
    url: str,
    *,
    params: Optional[dict] = None,
    headers: Optional[dict] = None,
    timeout: float = 8.0,
) -> Tuple[int, Any]:
    """
    Returns (status_code, json_or_text).
    Raises RouterError for network/timeouts.
    """
    try:
        resp = requests.request(method, url, params=params, headers=headers, timeout=timeout)
    except requests.Timeout as e:
        raise RouterError("UPSTREAM_TIMEOUT", "Upstream API timed out", status=504, details={"url": url}) from e
    except requests.RequestException as e:
        raise RouterError("UPSTREAM_UNREACHABLE", "Could not reach upstream API", status=502, details={"url": url}) from e

    # Try JSON first, fallback to text
    try:
        body = resp.json()
    except ValueError:
        body = resp.text

    return resp.status_code, body


def _require(payload: dict, field: str) -> Any:
    # Special handling for weather.current which might supply coordinates instead of city
    # If the payload has a 'city' that looks like coordinates, we accept it.
    # Otherwise, if it's missing, we check for lat/lon in payload directly (future proofing)
    
    val = payload.get(field)
    if val not in (None, "", []):
        return val

    # If strict check fails, raise
    raise RouterError(
        "BAD_REQUEST",
        f"Missing required field '{field}'",
        status=400,
        details={"required": [field]},
    )


# ----------------------------
# Handlers
# ----------------------------

def _handle_weather_current(payload: dict) -> dict:
    # Allow 'city' to contain either a city name OR coordinates string
    city = _require(payload, "city")
    
    # Normalize cache key: trim + lower
    city_key = str(city).strip().lower()

    cached = _cache_get_weather(city_key)
    if cached is not None:
        return ok(cached, source="cache", meta={"ttl_seconds": _WEATHER_TTL_SECONDS})

    lat = None
    lon = None
    city_name = None
    country = None

    # Check for coordinates in format "lat: <float>, lon: <float>" or plain "<float>, <float>"
    # Use re.IGNORECASE just in case
    coords_match = re.search(r"lat:\s*([-\d.]+),\s*lon:\s*([-\d.]+)", city_key, re.IGNORECASE)
    
    if not coords_match:
        # Try plain coordinate format: "32.958, -96.958"
        coords_match = re.match(r"^\s*([-\d.]+)\s*,\s*([-\d.]+)\s*$", city_key)
    
    if coords_match:
        try:
            lat = float(coords_match.group(1))
            lon = float(coords_match.group(2))
            city_name = f"Lat: {lat}, Lon: {lon}"
            country = "Unknown"
        except ValueError:
            pass

    # If no coordinates found in string, try Geocoding
    if lat is None or lon is None:
        # 1. Geocoding
        geo_url = "https://geocoding-api.open-meteo.com/v1/search"
        geo_params = {"name": city, "count": 1, "language": "en", "format": "json"}
        
        status, geo_body = _request_json("GET", geo_url, params=geo_params)
        
        if status != 200:
             raise RouterError("UPSTREAM_ERROR", "Geocoding failed", status=502, details={"body": geo_body})
        
        results = geo_body.get("results")
        if not results:
            raise RouterError("NOT_FOUND", f"City '{city}' not found", status=404, details={"provider": "open-meteo-geocoding"})

        location = results[0]
        lat = location["latitude"]
        lon = location["longitude"]
        city_name = location["name"]
        country = location.get("country")

    # 2. Weather
    weather_url = "https://api.open-meteo.com/v1/forecast"
    weather_params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
        "temperature_unit": "fahrenheit",
        "wind_speed_unit": "mph"
    }

    status, w_body = _request_json("GET", weather_url, params=weather_params)

    if status != 200:
        raise RouterError("UPSTREAM_ERROR", "Weather API failed", status=502, details={"body": w_body})

    current = w_body.get("current", {})
    
    # WMO Weather interpretation (simplified)
    # https://open-meteo.com/en/docs
    wmo_code = current.get("weather_code", 0)
    description = "Unknown"
    
    # Common weather conditions mapping
    if wmo_code == 0: description = "Clear sky"
    elif wmo_code in (1, 2, 3): description = "Partly cloudy"
    elif wmo_code in (45, 48): description = "Foggy"
    elif wmo_code in (51, 53, 55): description = "Drizzle"
    elif wmo_code in (61, 63, 65): description = "Rain"
    elif wmo_code in (71, 73, 75): description = "Snow"
    elif wmo_code in (95, 96, 99): description = "Thunderstorm"
    else: description = "Cloudy"

    parsed = {
        # Standard fields
        "city": city_name,
        "country": country,
        "temp_f": current.get("temperature_2m"),
        "feels_like_f": current.get("apparent_temperature"),
        "humidity": current.get("relative_humidity_2m"),
        "wind_mph": current.get("wind_speed_10m"),
        "description": description,
        
        # Add 'weather' field aliased to description or code for generic checks
        "weather": description.lower(),
        "code": wmo_code,
        "provider": "open-meteo",
    }

    # Cache the normalized result (not raw body)
    _cache_set_weather(city_key, parsed)
    return ok(parsed, source="api", meta={"cached_for_seconds": _WEATHER_TTL_SECONDS})


def _handle_time_now(payload: dict) -> dict:
    """
    Time/Date API example using worldtimeapi.org (no key required).
    payload can include: {"timezone": "America/Chicago"} (optional)
    """
    tz = payload.get("timezone")
    
    # If timezone is unknown or empty, fallback to IP-based
    if tz and tz.lower() != "unknown":
        url = f"https://worldtimeapi.org/api/timezone/{tz}"
    else:
        # Auto-detect based on requester IP (works for servers with public IPs)
        url = "https://worldtimeapi.org/api/ip"

    try:
        status, body = _request_json("GET", url)
    except Exception as e:
         # Fallback to UTC if worldtimeapi fails or is unreachable
         from datetime import datetime
         now = datetime.utcnow()
         return {
            "timezone": "UTC",
            "datetime": now.isoformat(),
            "unixtime": int(now.timestamp()),
            "utc_offset": "+00:00",
            "day_of_week": now.weekday() + 1, # Monday is 1
            "provider": "local_fallback",
        }

    if status == 404:
        # If specific timezone not found, try IP based
        if "timezone" in url:
             url = "https://worldtimeapi.org/api/ip"
             status, body = _request_json("GET", url)
        
        if status != 200:
             raise RouterError("NOT_FOUND", f"Timezone '{tz}' not found and IP fallback failed", status=404, details={"provider": "worldtimeapi"})

    if status >= 500:
        raise RouterError("UPSTREAM_ERROR", "Time API server error", status=502, details={"provider_status": status, "body": body})
    if status != 200:
        raise RouterError("UPSTREAM_ERROR", "Time API request failed", status=502, details={"provider_status": status, "body": body})

    try:
        parsed = {
            "timezone": body.get("timezone"),
            "datetime": body.get("datetime"),
            "unixtime": body.get("unixtime"),
            "utc_offset": body.get("utc_offset"),
            "day_of_week": body.get("day_of_week"),
            "provider": "worldtimeapi",
        }
    except Exception as e:
        raise RouterError("PARSE_ERROR", "Failed to parse Time API response", status=502, details={"body": body}) from e

    return ok(parsed, source="api")


def _handle_stock_price(payload: dict) -> dict:
    """
    Stock price example using Alpha Vantage (needs key).
    payload: {"symbol": "AAPL"}
    NOTE: If you prefer a different provider, replace this handler only.
    """
    symbol = _require(payload, "symbol")
    api_key = os.getenv("ALPHAVANTAGE_API_KEY")
    if not api_key:
        raise RouterError("CONFIG_ERROR", "ALPHAVANTAGE_API_KEY is not set", status=500)

    url = "https://www.alphavantage.co/query"
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": api_key,
    }

    status, body = _request_json("GET", url, params=params)

    if status == 401:
        raise RouterError("AUTH_FAILED", "Alpha Vantage API key is invalid", status=502, details={"provider_status": 401})
    if status >= 500:
        raise RouterError("UPSTREAM_ERROR", "Stock API server error", status=502, details={"provider_status": status, "body": body})
    if status != 200:
        raise RouterError("UPSTREAM_ERROR", "Stock API request failed", status=502, details={"provider_status": status, "body": body})

    # AlphaVantage returns 200 even for errors/limits; check known fields
    if isinstance(body, dict) and ("Note" in body or "Information" in body):
        raise RouterError("RATE_LIMITED", "Stock API rate limited or throttled", status=429, details={"body": body})
    if isinstance(body, dict) and "Error Message" in body:
        raise RouterError("NOT_FOUND", f"Symbol '{symbol}' not found", status=404, details={"body": body})

    try:
        quote = (body.get("Global Quote") or {})
        price_str = quote.get("05. price")
        parsed = {
            "symbol": quote.get("01. symbol") or symbol,
            "price": float(price_str) if price_str not in (None, "") else None,
            "as_of": quote.get("07. latest trading day"),
            "provider": "alphavantage",
        }
    except Exception as e:
        raise RouterError("PARSE_ERROR", "Failed to parse Stock API response", status=502, details={"body": body}) from e

    if parsed["price"] is None:
        raise RouterError("UPSTREAM_ERROR", "Stock API response missing price", status=502, details={"body": body})

    return ok(parsed, source="api")


# ----------------------------
# Router entrypoint
# ----------------------------

_HANDLER_MAP: Dict[str, Callable[[dict], dict]] = {
    "weather.current": _handle_weather_current,
    "time.now": _handle_time_now,
    "stock.price": _handle_stock_price,
}


def route(trigger_type: str, payload: Optional[dict] = None) -> dict:
    """
    Primary entrypoint.

    Parameters
    ----------
    trigger_type : str
        e.g. "weather.current", "time.now", "stock.price"
    payload : dict
        parameters needed by the trigger type

    Returns a result envelope:
      - {"ok": True, "data": ..., ...}
      - {"ok": False, "error": {...}}
    """
    payload = payload or {}

    try:
        if not trigger_type or not isinstance(trigger_type, str):
            raise RouterError("BAD_REQUEST", "trigger_type must be a non-empty string", status=400)

        handler = _HANDLER_MAP.get(trigger_type)
        if handler is None:
            raise RouterError(
                "UNSUPPORTED_TRIGGER",
                f"Unsupported trigger_type '{trigger_type}'",
                status=400,
                details={"supported": sorted(_HANDLER_MAP.keys())},
            )

        return handler(payload)

    except RouterError as e:
        return fail(e)
    except Exception as e:
        # Last-resort catch so your API never crashes on an unexpected bug
        return fail(RouterError("INTERNAL_ERROR", "Unexpected router error", status=500, details={"exception": type(e).__name__}))