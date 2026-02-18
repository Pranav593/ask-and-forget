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

app = FastAPI(title="Ask and Forget API")

# --- Security & Auth Setup ---

bearer = HTTPBearer()

def require_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        return auth.verify_id_token(creds.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")

# --- Pydantic Models ---

class AuthBody(BaseModel):
    email: EmailStr
    password: str

class Reminder(BaseModel):
    title: str
    data: str
    completed: bool = False

# --- General Routes ---

@app.get("/")
def read_root():
    return {"status": "Active", "msg": "Ask and Forget backend is running."}

# This endpoint preserves the database connection test from the 'reminders' branch
@app.get("/test-db")
def test_db_connection():
    try:
        doc_ref = db.collection("test_connection").document("status_check")
        doc_ref.set({
            "message": "Database is successfully connected!",
            "sender": "FastAPI Server"
        })
        return {"status": "Success", "database": "Firestore Connected"}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

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
def api_create(reminder: Reminder):
    return create_reminder(reminder.title, reminder.data)

@app.get("/reminders")
def api_read():
    return get_reminders()

@app.get("/reminders/{reminder_id}")
def api_read_one(reminder_id: str):
    return get_reminder(reminder_id)

@app.put("/reminders/{reminder_id}")
def api_update(reminder_id: str, updated_data: dict):
    return update_reminder(reminder_id, updated_data)

@app.delete("/reminders/{reminder_id}")
def api_delete(reminder_id: str):
    return delete_reminder(reminder_id)