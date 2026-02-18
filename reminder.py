from database import db

#create reminder
def create_reminder(title, data, completed=False):
    reminder_data = {
        "title": title,
        "data": data,
        "completed": completed
    }

    db.collection("reminders").add(reminder_data)

    return {"message": "Reminder created!"}

#all reminders
def get_reminders():
    reminders = []
    docs = db.collection("reminders").stream()

    for doc in docs:
        reminder = doc.to_dict()
        reminder["id"] = doc.id
        reminders.append(reminder)

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
def update_reminder(reminder_id, updated_data):
    doc_ref = db.collection("reminders").document(reminder_id)

    if doc_ref.get().exists:
        doc_ref.update(updated_data)
        return {"message": "Reminder updated successfully"}
    else:
        return {"error": "Reminder not found"}
    
#delete reminder
def delete_reminder(reminder_id):
    doc_ref = db.collection("reminders").document(reminder_id)

    if doc_ref.get().exists:
        doc_ref.delete()
        return {"message": "Reminder deleted successfully"}
    else:
        return {"error": "Reminder not found"}
