# Ask & Forget

**Set it. Forget it. We remember.**

Ask & Forget is a smart reminder app that lets you describe reminders in plain English. An AI-powered parser (Google Gemini) converts your natural language into structured trigger conditions — weather, stock prices, time — and a background engine continuously monitors those conditions, notifying you by email when they're met.

## Features

- **Natural Language Reminders** — Describe what you want ("remind me when the temperature drops below 50°F in my area") and the AI figures out the trigger type, metric, and threshold.
- **Real-Time Condition Monitoring** — A polling engine checks weather, stock prices, and time conditions every 60 seconds.
- **Weather Data** — Supports city names and browser geolocation coordinates via the Open-Meteo API.
- **Email Notifications** — Sends confirmation emails on reminder creation and trigger emails when conditions are met (via Resend).
- **Firebase Auth & Firestore** — Secure user authentication and cloud-based reminder storage.
- **Interactive Dashboard** — React frontend with reminder management (create, view, delete, refresh), a parallax animated login page, and a one-click engine trigger.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Axios |
| Backend | FastAPI, Uvicorn |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| AI / NLP | Google Gemini (via `google-genai`) |
| Data APIs | Open-Meteo (weather), Alpha Vantage (stocks), WorldTimeAPI (time) |
| Email | Resend |

## Project Structure

```
├── main.py              # FastAPI app with all routes
├── auth.py              # Firebase signup/login helpers
├── database.py          # Firestore client init
├── reminder.py          # CRUD operations for reminders
├── reminder_engine.py   # Polling engine that evaluates conditions
├── run_engine.py        # Standalone script to run the engine loop
├── engine_routes.py     # API routes for manually triggering the engine
├── data_route.py        # Data router (weather, stock, time APIs)
├── evaluator.py         # Condition evaluator (==, >, <, etc.)
├── llm_parser.py        # Gemini-based natural language parser
├── email_service.py     # Resend email helpers
├── cleanup_db.py        # Firestore cleanup utility
├── frontend/            # React + Vite frontend
│   └── src/
│       ├── pages/       # LoginPage, DashboardPage
│       ├── components/  # ReminderCard, CreateReminderModal
│       ├── hooks/       # useAuth
│       └── api/         # Axios client with auth interceptor
└── requirements.txt     # Python dependencies
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Firebase project with Firestore and Authentication enabled
- API keys: Google Gemini, Resend, (optional) Alpha Vantage

### Backend

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Add .env with GEMINI_API_KEY, RESEND_API_KEY, etc.
# Place serviceAccountKey.json for Firebase Admin
uvicorn main:app --reload
```

### Reminder Engine

```bash
python run_engine.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```