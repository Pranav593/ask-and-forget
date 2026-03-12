from fastapi import APIRouter, HTTPException
from reminder_engine import ReminderEngine
from reminder import get_reminder

router = APIRouter(prefix="/engine", tags=["engine"])


@router.post("/run")
def run_engine_cycle():
    """
    Manually trigger a single reminder engine cycle
    """
    ReminderEngine.run_cycle()

    return {
        "success": True,
        "message": "Reminder engine cycle executed"
    }


@router.post("/run/{reminder_id}")
def run_single_reminder(reminder_id: str):
    """
    Manually trigger a check for a specific reminder
    """
    reminder = get_reminder(reminder_id)
    if not reminder or "error" in reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    ReminderEngine.process_reminder(reminder)

    return {
        "success": True,
        "message": f"Processed reminder {reminder_id}"
    }