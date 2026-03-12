from fastapi import APIRouter
from reminder_engine import ReminderEngine

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