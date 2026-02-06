from fastapi import FastAPI
from database import db

app = FastAPI(title="Ask and Forget API")

@app.get("/")
def read_root():
    return {"status": "Active", "msg": "UTD GDSC Backend02 is running!"}

@app.get("/test-db")
def test_database():
    try:
        doc_ref = db.collection("test_connection").document("status_check")
        doc_ref.set({
            "message": "Database is successfully connected!",
            "sender": "FastAPI Server"
        })
        return {"status": "Success", "database": "Firestore Connected"}
    except Exception as e:
        return {"status": "Error", "message": str(e)}