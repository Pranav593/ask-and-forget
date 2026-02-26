from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from firebase_admin import credentials, auth
from database import db
from auth import signup as fb_signup, login as fb_login
from reminder import (
    create_reminder, 
    get_reminders, 
    get_reminder, 
    update_reminder, 
    delete_reminder
)
from auth import verify_id_token


app = FastAPI(title="Ask and Forget API")

# --- Security & Auth Setup ---

bearer = HTTPBearer()

def require_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        user_info = auth.verify_id_token(creds.credentials)
        return user_info

    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

# --- Pydantic Models ---

class AuthBody(BaseModel):
    email: EmailStr
    password: str

class Condition(BaseModel):
    type: str
    threshold: Optional[int] = None

class TriggerParams(BaseModel):
    metric: str
    operator: int
    value: int

class Reminder(BaseModel):
    title: str
    trigger_type: str
    location: str
    trigger_params: TriggerParams
    status: str
    isActive: bool


# --- General Routes ---

@app.get("/")
def read_root():
    return {"status": "Active", "msg": "Ask and Forget backend is running."}

# --- Authentication Routes ---

@app.post("/auth/signup")
def signup(body: AuthBody):
    try:
        data = fb_signup(body.email, body.password)
        return {
            "tokenId": data["idToken"],
            "refreshToken": data["refreshToken"],
            "expiresIn": data["expiresIn"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
def login(body: AuthBody):
    try:
        data = fb_login(body.email, body.password)
        return {
            "tokenId": data["idToken"],
            "refreshToken": data["refreshToken"],
            "expiresIn": data["expiresIn"]
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/auth/me")
def me(user=Depends(require_user)):
    return {
        "uid": user["uid"],
        "email": user.get("email"),
        "email_verified": user.get("email_verified")
    }

@app.get("/protected")
def protected(user=Depends(require_user)):
    return {"ok": True, "uid": user["uid"], "message": "Authorized"}

# --- Reminder Routes ---

@app.post("/reminders")
def api_create(reminder: Reminder, user=Depends(require_user)):
    uid = user["uid"]
    return create_reminder(
        user_id = uid,
        reminder_dict = reminder.dict()
    )

@app.get("/reminders")
def api_read(user=Depends(require_user), is_active: Optional[bool] = True):
    uid = user["uid"]
    return get_reminders(uid, is_active)

@app.get("/reminders/{reminder_id}")
def api_read_one(reminder_id: str, user=Depends(require_user)):
    uid = user["uid"]
    return get_reminder(reminder_id, user_id=uid)

@app.put("/reminders/{reminder_id}")
def api_update(reminder_id: str, updated_data: dict, user=Depends(require_user)):
    uid = user["uid"]
    return update_reminder(reminder_id, updated_data, user_id=uid)

@app.delete("/reminders/{reminder_id}")
def api_delete(reminder_id: str, user=Depends(require_user)):
    uid = user["uid"]
    return delete_reminder(reminder_id, user_id=uid)