from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from firebase_admin import auth
from database import db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials




from auth import signup as fb_signup, login as fb_login

app = FastAPI(title="Ask and Forget API")

bearer_scheme = HTTPBearer()

@app.get("/")
def read_root():
    return {"status": "Active", "msg": "Ask and Forget backend is running."}
    
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
    

# For some odd reason, Swagger UI is not sending the Authorization header with the Bearer token, so
# I have coded in an authorization http bearer to test authentication appropriately.

def require_user(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    return auth.verify_id_token(creds.credentials)



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

