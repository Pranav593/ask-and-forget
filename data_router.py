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
    if field not in payload or payload[field] in (None, "", []):
        raise RouterError(
            "BAD_REQUEST",
            f"Missing required field '{field}'",
            status=400,
            details={"required": [field]},
        )
    return payload[field]


# ----------------------------
# Handlers
# ----------------------------

def _handle_weather_current(payload: dict) -> dict:
    city = _require(payload, "city")
    # Normalize cache key: trim + lower
    city_key = str(city).strip().lower()

    cached = _cache_get_weather(city_key)
    if cached is not None:
        return ok(cached, source="cache", meta={"ttl_seconds": _WEATHER_TTL_SECONDS})

    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise RouterError(
            "CONFIG_ERROR",
            "OPENWEATHER_API_KEY is not set",
            status=500,
        )

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": api_key,
        "units": "imperial",  # F; change to "metric" if preferred
    }

    status, body = _request_json("GET", url, params=params)

    # OpenWeather error shapes vary; handle status first
    if status == 401:
        raise RouterError("AUTH_FAILED", "OpenWeather API key is invalid", status=502, details={"provider_status": 401})
    if status == 404:
        # e.g., "city not found"
        raise RouterError("NOT_FOUND", f"City '{city}' not found", status=404, details={"provider": "openweather"})
    if status >= 500:
        raise RouterError("UPSTREAM_ERROR", "OpenWeather server error", status=502, details={"provider_status": status, "body": body})
    if status != 200:
        raise RouterError("UPSTREAM_ERROR", "OpenWeather request failed", status=502, details={"provider_status": status, "body": body})

    # Validate expected fields
    try:
        parsed = {
            "city": body.get("name") or city,
            "country": (body.get("sys") or {}).get("country"),
            "temp_f": (body.get("main") or {}).get("temp"),
            "feels_like_f": (body.get("main") or {}).get("feels_like"),
            "humidity": (body.get("main") or {}).get("humidity"),
            "wind_mph": (body.get("wind") or {}).get("speed"),
            "description": ((body.get("weather") or [{}])[0]).get("description"),
            "provider": "openweather",
        }
    except Exception as e:
        raise RouterError("PARSE_ERROR", "Failed to parse OpenWeather response", status=502, details={"body": body}) from e

    # Cache the normalized result (not raw body)
    _cache_set_weather(city_key, parsed)
    return ok(parsed, source="api", meta={"cached_for_seconds": _WEATHER_TTL_SECONDS})


def _handle_time_now(payload: dict) -> dict:
    """
    Time/Date API example using worldtimeapi.org (no key required).
    payload can include: {"timezone": "America/Chicago"} (optional)
    """
    tz = payload.get("timezone")
    if tz:
        url = f"https://worldtimeapi.org/api/timezone/{tz}"
    else:
        # Auto-detect based on requester IP (works for servers with public IPs)
        url = "https://worldtimeapi.org/api/ip"

    status, body = _request_json("GET", url)

    if status == 404:
        raise RouterError("NOT_FOUND", f"Timezone '{tz}' not found", status=404, details={"provider": "worldtimeapi"})
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