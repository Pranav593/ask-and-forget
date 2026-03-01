import json
import os
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, ConfigDict, ValidationError

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

_DEFAULT_PROMPT_TEMPLATE = """
You are an information extraction engine.
Convert the user sentence into a JSON object using EXACTLY this schema:
{
    "user_id": "string",
    "title": "string",
    "trigger_type": "string",
    "location": "string",
    "condition": {
        "type": "string",
        "threshold": 0
    },
    "is_active": true,
    "created_at": "YYYY-MM-DDTHH:MM:SS",
    "last_triggered_at": null
}
Rules:
- Return ONLY valid JSON (no markdown, no code fences, no comments).
- Output must be a single JSON object that matches the schema exactly.
- Do not include any extra keys.
- If a value is unknown, use an empty string "" (or null for last_triggered_at).
- Use an ISO 8601 timestamp for created_at if available, otherwise empty string.
- Keep threshold as a number (use 0 if unknown).
User sentence: "__USER_SENTENCE__"
""".strip()


class Condition(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: str = ""
    threshold: float = 0


class Reminder(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: str = ""
    title: str = ""
    trigger_type: str = ""
    location: str = ""
    condition: Condition = Condition()
    is_active: bool = True
    created_at: str = ""
    last_triggered_at: Optional[str] = None


def _get_client() -> Optional[genai.Client]:
    if not GEMINI_API_KEY:
        return None
    return genai.Client(api_key=GEMINI_API_KEY)


def _safe_json_loads(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None

    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    if start == -1:
        return None

    decoder = json.JSONDecoder()
    try:
        obj, _ = decoder.raw_decode(text[start:])
        return obj if isinstance(obj, dict) else None
    except json.JSONDecodeError:
        return None


def parse_sentence_to_json(sentence: str) -> Dict[str, Any]:
    prompt = _DEFAULT_PROMPT_TEMPLATE.replace("__USER_SENTENCE__", sentence)
    client = _get_client()
    if client is None:
        return Reminder().model_dump()

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
        )
    except Exception:
        return Reminder().model_dump()

    parsed = _safe_json_loads(getattr(response, "text", "") or "")
    if parsed is not None:
        try:
            reminder = Reminder.model_validate(parsed)
            return reminder.model_dump()
        except ValidationError:
            pass

    return Reminder().model_dump()
