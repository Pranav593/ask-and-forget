"""
email_service.py
----------------
Resend-powered email service for Ask & Forget.

Two public functions:
  - send_reminder_confirmation(to_email, reminder)   → called after a reminder is created
  - send_reminder_triggered(to_email, reminder)       → called when a reminder fires

Setup
-----
1.  Create a free account at https://resend.com
2.  Add & verify your sending domain (Resend → Domains → Add Domain).
    For quick local testing you can use Resend's shared domain and send
    only to your own verified email address.
3.  Generate an API key (Resend → API Keys → Create API Key).
4.  Add to your .env:
        RESEND_API_KEY=re_xxxxxxxxxxxx
        RESEND_FROM_EMAIL=reminders@yourdomain.com   # must match verified domain
"""

from __future__ import annotations

import os
from typing import Any

import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "")

# The "From" address must belong to a domain you've verified in Resend.
_FROM = os.getenv("RESEND_FROM_EMAIL", "reminders@yourdomain.com")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _send(to: str, subject: str, html: str) -> dict[str, Any]:
    """
    Thin wrapper around resend.Emails.send.
    Returns {"id": "<message-id>"} on success.
    Raises RuntimeError on misconfiguration or API error.
    """
    if not resend.api_key:
        raise RuntimeError(
            "RESEND_API_KEY is not set. "
            "Add it to your .env file (see email_service.py docstring)."
        )

    params: resend.Emails.SendParams = {
        "from": _FROM,
        "to": [to],
        "subject": subject,
        "html": html,
    }

    response = resend.Emails.send(params)
    return response


def _reminder_detail_rows(reminder: dict) -> str:
    """Build <tr> rows for the reminder detail table."""
    fields = {
        "Title": reminder.get("title", "—"),
        "Trigger type": reminder.get("trigger_type", "—"),
        "Location": reminder.get("location") or "—",
        "Status": "Active" if reminder.get("isActive", reminder.get("is_active", True)) else "Inactive",
    }
    rows = ""
    for label, value in fields.items():
        rows += f"""
        <tr>
          <td style="padding:8px 12px;color:#6b7280;font-size:14px;width:130px">{label}</td>
          <td style="padding:8px 12px;color:#1f2937;font-size:14px;font-weight:500">{value}</td>
        </tr>"""
    return rows


def _base_template(header_color: str, header_text: str, body_html: str) -> str:
    """Shared outer HTML shell so both emails look consistent."""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>{header_text}</title>
</head>
<body style="margin:0;padding:0;background:#dbeafe;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:16px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(59,130,246,.15)">

          <!-- Header -->
          <tr>
            <td style="background:{header_color};padding:32px 40px;text-align:center">
              <p style="margin:0 0 6px;color:rgba(255,255,255,.85);font-size:13px;
                        letter-spacing:2px;text-transform:uppercase">Ask &amp; Forget</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700">
                {header_text}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px">
              {body_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center">
              <p style="margin:0;color:#9ca3af;font-size:12px">
                You received this email because you use Ask &amp; Forget.<br/>
                Set it. Forget it. We remember.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def send_reminder_confirmation(to_email: str, reminder: dict) -> dict[str, Any]:
    """
    Send a confirmation email immediately after a reminder is created.

    Parameters
    ----------
    to_email : str
        The user's email address.
    reminder : dict
        The reminder object returned from create_reminder / the Pydantic model.
        Expected keys: title, trigger_type, location, isActive / is_active.

    Returns
    -------
    dict
        Resend response containing the message id, e.g. {"id": "abc123"}.
    """
    title = reminder.get("title", "Your reminder")
    detail_rows = _reminder_detail_rows(reminder)

    body = f"""
      <p style="margin:0 0 16px;color:#374151;font-size:16px">
        Your reminder has been saved. We'll notify you when it's time&nbsp;⏰
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e5e7eb;border-radius:10px;
                    overflow:hidden;margin-bottom:24px">
        <tr style="background:#eff6ff">
          <td colspan="2" style="padding:10px 12px;font-size:12px;
                                  color:#3b82f6;font-weight:600;
                                  letter-spacing:1px;text-transform:uppercase">
            Reminder Details
          </td>
        </tr>
        {detail_rows}
      </table>

      <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6">
        You can view, edit, or delete this reminder anytime from your dashboard.
        We'll send you another email as soon as it triggers — so go ahead and
        forget about it!
      </p>
    """

    html = _base_template(
        header_color="#3b82f6",
        header_text="Reminder Confirmed ✓",
        body_html=body,
    )

    return _send(
        to=to_email,
        subject=f"✓ Reminder set: {title}",
        html=html,
    )


def send_reminder_triggered(to_email: str, reminder: dict) -> dict[str, Any]:
    """
    Send a notification email when a reminder is triggered.

    Parameters
    ----------
    to_email : str
        The user's email address.
    reminder : dict
        The reminder object (same shape as above).

    Returns
    -------
    dict
        Resend response containing the message id.
    """
    title = reminder.get("title", "Your reminder")
    trigger_type = reminder.get("trigger_type", "")
    location = reminder.get("location") or ""

    # Build a human-friendly trigger sentence
    if trigger_type == "location" and location:
        trigger_sentence = f"You've arrived at <strong>{location}</strong>."
    elif trigger_type == "time":
        trigger_sentence = "The scheduled time has been reached."
    elif trigger_type == "metric":
        metric = (reminder.get("condition") or {}).get("type", "metric")
        trigger_sentence = f"The <strong>{metric}</strong> condition has been met."
    else:
        trigger_sentence = "Your reminder condition has been met."

    detail_rows = _reminder_detail_rows(reminder)

    body = f"""
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;
                  padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;color:#92400e;font-size:15px;font-weight:600">
          🔔 &nbsp;{title}
        </p>
        <p style="margin:8px 0 0;color:#78350f;font-size:14px">
          {trigger_sentence}
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e5e7eb;border-radius:10px;
                    overflow:hidden;margin-bottom:24px">
        <tr style="background:#eff6ff">
          <td colspan="2" style="padding:10px 12px;font-size:12px;
                                  color:#3b82f6;font-weight:600;
                                  letter-spacing:1px;text-transform:uppercase">
            Reminder Details
          </td>
        </tr>
        {detail_rows}
      </table>

      <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6">
        This reminder has been marked as triggered. Head to your dashboard if you'd
        like to re-activate it or set a new one.
      </p>
    """

    html = _base_template(
        header_color="#f59e0b",
        header_text="Reminder Triggered 🔔",
        body_html=body,
    )

    return _send(
        to=to_email,
        subject=f"🔔 Reminder: {title}",
        html=html,
    )