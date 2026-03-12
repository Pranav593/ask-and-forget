# test_email.py  (run this once from your project root)
from email_service import send_reminder_confirmation

result = send_reminder_confirmation(
    to_email="cjwiratman@gmail.com",   # must be YOUR Resend account email while using onboarding@resend.dev
    reminder={
        "title": "Buy milk",
        "trigger_type": "location",
        "location": "Grocery Store",
        "isActive": True,
    }
)
print(result)  # should print {"id": "some-message-id"}