from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from firebase_admin import credentials, auth
from database import db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials




from auth import signup as fb_signup, login as fb_login

app = FastAPI(title="Ask and Forget API")


# Gets bearer token from the Authorization header and verifies it with Firebase Admin SDK.
# If valid, returns the decoded token (user info). If invalid, raises an HTTP 401 error.
bearer = HTTPBearer()

@app.get("/")
def read_root():
    return {"status": "Active", "msg": "Ask and Forget backend is running."}

# Signup and Login

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


    
    
# Verification

# For some odd reason, Swagger UI is not sending the Authorization header with the Bearer token, so
# I have coded in an authorization http bearer to test authentication appropriately.

def require_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    
    try:
        return auth.verify_id_token(creds.credentials)

    except Exception:
        # Catch anything unexpected
        raise HTTPException(status_code=401, detail="Authentication failed")


# Data extraction

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

