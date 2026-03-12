from google.cloud.firestore import FieldFilter
from database import db

def cleanup_reminders():
    print("Finding invalid reminders...")
    
    # Get all active reminders to check them
    # Note: Using filter=FieldFilter per warning recommendation
    docs = db.collection("reminders").where(filter=FieldFilter("is_active", "==", True)).stream()
    
    deleted_count = 0
    valid_count = 0
    
    valid_triggers = ["weather.current", "stock.price", "time.now"]

    for doc in docs:
        data = doc.to_dict()
        rid = doc.id
        
        trigger_type = data.get("trigger_type")
        location = data.get("location")
        
        should_delete = False
        reason = ""

        # Check 1: Valid Trigger Type
        if trigger_type not in valid_triggers:
            should_delete = True
            reason = f"Invalid trigger_type: '{trigger_type}'"
            
        # Check 2: Missing specific required fields for triggers
        elif trigger_type == "weather.current" and not location:
            should_delete = True
            reason = "Weather trigger missing location"
            
        elif trigger_type == "stock.price" and not location:
            # Note: Engine uses 'location' field to store stock symbol currently
            should_delete = True
            reason = "Stock trigger missing symbol (in location field)"
            
        if should_delete:
            print(f"Deleting reminder {rid}: {reason}")
            try:
                # Soft delete by setting inactive, or hard delete?
                # Let's hard delete for cleanup
                db.collection("reminders").document(rid).delete()
                deleted_count += 1
            except Exception as e:
                print(f"Error deleting {rid}: {e}")
        else:
            valid_count += 1

    print(f"\nCleanup complete.")
    print(f"Deleted: {deleted_count}")
    print(f"Valid/Remaining: {valid_count}")

if __name__ == "__main__":
    cleanup_reminders()