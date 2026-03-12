# Ask and Forget - Setup Guide

This guide provides step-by-step instructions to set up and run the full stack "Ask and Forget" application.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** & **npm**
- **Firebase Account** (for Authentication & Database)
- **Google Gemini API Key** (for LLM parsing)
- **Alpha Vantage API Key** (for Stock data)

---

## 1. Backend Setup

The backend handles the API logic, database communication, and reminder processing.

### A. Environment Setup

1.  **Navigate to the project root:**
    ```bash
    cd ask-and-forget
    ```

2.  **Create a virtual environment:**
    ```bash
    python3 -m venv venv
    ```

3.  **Activate the virtual environment:**
    - **Mac/Linux:**
      ```bash
      source venv/bin/activate
      ```
    - **Windows:**
      ```bash
      .\venv\Scripts\activate
      ```

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### B. Configuration (.env)

1.  **Copy the example environment file:**
    ```bash
    cp .env.example .env
    ```

2.  **Edit `.env` and fill in your API keys:**
    - `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/)
    - `ALPHAVANTAGE_API_KEY`: Get from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
    - `FIREBASE_WEB_API_KEY`: Found in **Project Settings > General > Web API Key** in Firebase Console.

### C. Firebase Credentials

1.  Go to your **Firebase Console**.
2.  Navigate to **Project Settings > Service Accounts**.
3.  Click **Generate new private key**.
4.  Rename the downloaded file to `serviceAccountKey.json`.
5.  Place this file in the **root directory** of the project (`ask-and-forget/`).

---

## 2. Frontend Setup

The frontend is a React application built with Vite.

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

---

## 3. Running the Application

You will need **three terminal windows** running simultaneously.

### Terminal 1: Backend API

This runs the FastAPI server to handle requests from the frontend.

```bash
# From project root
source venv/bin/activate
uvicorn main:app --reload
```
*Server will start at `http://127.0.0.1:8000`*

### Terminal 2: Reminder Engine

This runs the background process that checks weather, stocks, and time conditions.

```bash
# From project root
source venv/bin/activate
python run_engine.py
```
*You will see logs indicating the engine is checking for reminders.*

### Terminal 3: Frontend

This runs the user interface.

```bash
# From project root
cd frontend
npm run dev
```
*Frontend will typically start at `http://localhost:5173`*

---

## 4. Verification

1.  Open the frontend URL (`http://localhost:5173`) in your browser.
2.  **Sign Up / Login** using the authentication page.
3.  **Create a Reminder:**
    - Click "Create Reminder".
    - Type: _"Remind me to buy milk if Apple stock is above 150"_
    - Click **"Parse Reminder with Gemini"**.
    - Verify the fields are filled correctly (Symbol: AAPL, Condition: >, Value: 150).
    - Click **"Create"**.
4.  **Check Engine:**
    - Look at **Terminal 2**. You should see the engine processing the new reminder.
    - If the condition is met, it will trigger (log message).
5.  **Manual Trigger:**
    - Click the **"Run Reminder Engine"** button in the frontend modal to force a check immediately.

---

## Troubleshooting

- **Backend errors:** Check `uvicorn` logs in Terminal 1.
- **Engine not firing:** Ensure `run_engine.py` is running in Terminal 2.
- **Frontend connection refused:** Ensure backend is running on port `8000`.
- **Firebase errors:** Verify `serviceAccountKey.json` is valid and correct.
