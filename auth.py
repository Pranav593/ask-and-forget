import os
import firebase_admin
from firebase_admin import auth as admin_auth
import requests
from dotenv import load_dotenv

load_dotenv()

FIREBASE_API_KEY = os.getenv("FIREBASE_WEB_API_KEY")
if not FIREBASE_API_KEY:
    raise RuntimeError("Missing FIREBASE_API_KEY in .env")

def verify_id_token(token: str) -> dict:
    try:
        decoded = admin.auth.verify_id_token(token)
        return decoded
    except Exception:
        raise ValueError("INVALID_TOKEN")
  
def _post(endpoint: str, payload: dict) -> dict:
    url = f"https://identitytoolkit.googleapis.com/v1/{endpoint}?key={FIREBASE_API_KEY}"
    r = requests.post(url, json=payload, timeout=15)
    data = r.json()
    if r.status_code != 200:
        msg = data.get("error", {}).get("message", "AUTH_FAILED")
        raise ValueError(msg)
    return data

def signup(email: str, password: str) -> dict:
    return _post("accounts:signUp", {
        "email": email,
        "password": password,
        "returnSecureToken": True
    })

def login(email: str, password: str) -> dict:
    return _post("accounts:signInWithPassword", {
        "email": email,
        "password": password,
        "returnSecureToken": True
    })
