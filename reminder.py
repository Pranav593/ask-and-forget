from datetime import datetime
from database import db

#create reminder
def create_reminder(user_id, reminder_dict):
    reminder_dict["user_id"] = user_id
    reminder_dict["is_active"] = True
    reminder_dict["created_at"] = datetime.utcnow()

    doc = db.collection("reminders").add(reminder_dict)

    return {"id": doc[1].id, "message": "Reminder created!"}

#all reminders
def get_reminders(user_id, is_active=True):
    docs = db.collection("reminders") \
    .where("user_id", "==", user_id) \
    .where("is_active", "==", is_active) \
    .order_by("created_at") \
    .stream()

    reminders = []
    
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        reminders.append(data)

    return reminders


#read one reminder
def get_reminder(reminder_id):
    doc = db.collection("reminders").document(reminder_id).get()

    if doc.exists:
        reminder = doc.to_dict()
        reminder["id"] = doc.id
        return reminder
    else:
        return {"error": "Reminder not found!"}
    
#update reminder
def update_reminder(reminder_id, updated_data, user_id):
    doc_ref = db.collection("reminders").document(reminder_id)
    doc = doc_ref.get()

    if not doc.exists:
        return {"error": "Reminder not found!"}
    
    if doc.to_dict()["user_id"] != user_id:
        return {"error": "Unauthorized"}
    
    doc_ref.update(updated_data)
    return {"message": "Reminder updated successfully"}
    
    
#delete reminder
def delete_reminder(reminder_id, user_id):
    doc_ref = db.collection("reminders").document(reminder_id)
    doc = doc_ref.get()

    if not doc.exists:
        return {"error": "Not found"}
    
    if doc.to_dict()["user_id"] != user_id:
        return {"error": "Unauthorized"}
    
    doc_ref.update({"is_active": False})
    return {"message": "Reminder deactivated successfully"}