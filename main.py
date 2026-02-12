from fastapi import FastAPI
from database import db
from pydantic import BaseModel
from reminder import create_reminder, get_reminders, get_reminder, update_reminder, delete_reminder

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
    
class Reminder(BaseModel):
    title: str
    data: str
    completed: bool = False
    
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
