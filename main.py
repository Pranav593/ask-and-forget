from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from firebase_admin import auth
from database import db

from auth import signup as fb_signup, login as fb_login

app = FastAPI(title="Ask and Forget API")



@app.get("/")
def read_root():
    return {"status": "Active", "msg": "UTD GDSC Backend02 is running!"}
    
# Authentication

# signup and login routes

class AuthBody(BaseModel):
    email: EmailStr
    password: str

@app.post("/auth/signup")
def signup(body: AuthBody):
    try:
        data = fb_signup(body.email, body.password)
        return {
            "tokenId": data["idToken"],          # Firebase ID token (JWT)
            "refreshToken": data["refreshToken"],
            "expiresIn": data["expiresIn"]       # seconds (string)
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
    

def require_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty Bearer token")

    try:
        decoded = auth.verify_id_token(token)
        # decoded contains uid, iat, exp, and possibly email
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@app.get("/auth/me")
def me(user=Depends(require_user)):
    return {"uid": user["uid"], "claims": user}


@app.get("/protected")
def protected(user=Depends(require_user)):
    return {"ok": True, "uid": user["uid"], "message": "Authorized"}

