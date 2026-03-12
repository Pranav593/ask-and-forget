# Ask and Forget Frontend

Modern React frontend for the Ask and Forget reminder app.

## Setup

```bash
cd frontend
npm install
npm run dev
```

The app will run on `http://localhost:3000`

## Features

- **Authentication** - Login/Signup with Firebase
- **Reminder Dashboard** - View, create, and manage reminders
- **NLP Parsing** - Describe reminders in natural language
- **Responsive Design** - Works on desktop and mobile

## Project Structure

```
src/
├── pages/         # Page components (Login, Dashboard)
├── components/    # Reusable components (ReminderCard, Modal)
├── hooks/         # Custom React hooks
├── api/           # API client and endpoints
├── App.jsx        # Main app component
└── index.css      # Tailwind styles
```

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000`. Common endpoints:

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /reminders` - Get all reminders
- `POST /reminders` - Create reminder
- `POST /parse` - Parse natural language to reminder
- `PUT /reminders/:id` - Update reminder
- `DELETE /reminders/:id` - Delete reminder
