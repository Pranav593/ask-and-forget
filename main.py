from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Header, Request, BackgroundTasks
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from firebase_admin import credentials, auth
from database import db
from reminder_engine import ReminderEngine
from auth import signup as fb_signup, login as fb_login
from reminder import (
    create_reminder,
    get_reminders,
    get_reminder,
    update_reminder,
    delete_reminder,
)
from fastapi.middleware.cors import CORSMiddleware
from auth import verify_id_token
from llm_parser import parse_sentence_to_json
from email_service import send_reminder_confirmation, send_reminder_triggered
from engine_routes import router as engine_router


app = FastAPI(title="Ask and Forget API")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation Error: {exc.errors()}")
    print(f"Body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )

# --- CORS Setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security & Auth Setup ---

bearer = HTTPBearer()


def require_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        user_info = auth.verify_id_token(creds.credentials)
        return user_info
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")


# --- Pydantic Models ---

class AuthBody(BaseModel):
    email: EmailStr
    password: str


class ParseRequest(BaseModel):
    sentence: str


class Condition(BaseModel):
    metric: str
    operator: str
    value: str | int | float | bool


class ReminderBody(BaseModel):
    title: str
    trigger_type: str
    location: str
    condition: Condition
    status: str
    is_active: bool


# --- General Routes ---

@app.get("/")
def read_root():
    return {"status": "Active", "msg": "Ask and Forget backend is running."}


@app.get("/test-db")
def test_db():
    try:
        doc_ref = db.collection("test_connection").document("status_check")
        doc_ref.set({
            "message": "Database is successfully connected!",
            "sender": "FastAPI Server",
        })
        return {"status": "Success", "database": "Firestore Connected"}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

# --- Include Engine Routes ---
app.include_router(engine_router)

# --- NLP Parsing Route ---

@app.post("/parse")
def parse_sentence(payload: ParseRequest):
    result = parse_sentence_to_json(payload.sentence)
    return {"status": "Success", "data": result}


# =========================
# Auth Routes
# =========================

@app.post("/auth/signup")
def signup(body: AuthBody):
    try:
        data = fb_signup(body.email, body.password)

        user_info = auth.verify_id_token(data["idToken"])
        uid = user_info["uid"]

        db.collection("users").document(uid).set({
            "email": body.email,
            "created_at": datetime.utcnow().isoformat()
        })

        return {
            "tokenId": data["idToken"],
            "refreshToken": data["refreshToken"],
            "expiresIn": data["expiresIn"],
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
            "expiresIn": data["expiresIn"],
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/auth/me")
def me(user=Depends(require_user)):
    return {
        "uid": user["uid"],
        "email": user.get("email"),
        "email_verified": user.get("email_verified"),
    }


@app.get("/protected")
def protected(user=Depends(require_user)):
    return {"ok": True, "uid": user["uid"], "message": "Authorized"}


# =========================
# Reminder Routes
# =========================

@app.post("/reminders")
def api_create(
    reminder: ReminderBody,
    background_tasks: BackgroundTasks,
    user=Depends(require_user),
):
    uid = user["uid"]
    user_email = user.get("email", "")

    result = create_reminder(user_id=uid, reminder_dict=reminder.dict())

    # Send confirmation email in the background so it never blocks the response.
    if user_email:
        background_tasks.add_task(
            send_reminder_confirmation,
            to_email=user_email,
            reminder=reminder.dict(),
        )

    return result


@app.get("/reminders")
def api_read(user=Depends(require_user), is_active: Optional[bool] = True):
    uid = user["uid"]
    return get_reminders(uid, is_active)


@app.get("/reminders/{reminder_id}")
def api_read_one(reminder_id: str, user=Depends(require_user)):
    uid = user["uid"]
    return get_reminder(reminder_id, user_id=uid)


@app.put("/reminders/{reminder_id}")
def api_update(
    reminder_id: str,
    updated_data: dict,
    user=Depends(require_user),
):
    uid = user["uid"]
    return update_reminder(reminder_id, updated_data, user_id=uid)


@app.delete("/reminders/{reminder_id}")
def api_delete(reminder_id: str, user=Depends(require_user)):
    uid = user["uid"]
    return delete_reminder(reminder_id, user_id=uid)


# =========================
# Trigger Route
# =========================

@app.post("/reminders/{reminder_id}/trigger")
def api_trigger(
    reminder_id: str,
    background_tasks: BackgroundTasks,
    user=Depends(require_user),
):
    """
    Mark a reminder as triggered and email the user.
    Call this endpoint from your trigger-checking logic (scheduler,
    location webhook, data-route evaluation, etc.) whenever a
    reminder's condition is met.
    """
    uid = user["uid"]
    user_email = user.get("email")

    reminder = get_reminder(reminder_id, user_id=uid)
    if "error" in reminder:
        raise HTTPException(status_code=404, detail=reminder["error"])

    # Deactivate the reminder so it doesn't fire again
    update_reminder(
        reminder_id,
        {"is_active": False, "isActive": False, "last_triggered_at": datetime.utcnow()},
        user_id=uid,
    )

    if user_email:
        background_tasks.add_task(
            send_reminder_triggered,
            to_email=user_email,
            reminder=reminder,
        )

    return {"status": "triggered", "reminder_id": reminder_id}
