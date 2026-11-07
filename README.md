# SayHii — Connect Without Revealing

> **Zero-trace, anonymous, ephemeral messaging with hardware-level privacy shields and instant departure detection.**

---

## Overview

**SayHii** is an ultra-secure, anonymous ephemeral chat platform. It lets people communicate in real time without storing conversations on disk or database. All session messages exist strictly in volatile server RAM and are immediately destroyed when participants leave.

### Key Capabilities

- **Random Stranger Matchmaking**: 1-click anonymous matchmaking pairing two strangers with randomized handles.
- **Private Code Rooms**: 2-person exclusive rooms protected by unguessable 8-character codes with automatic brute-force lockout.
- **Stealth Veil & Anti-Capture Shields**:
  - Peek-to-Reveal masking layer preventing shoulder-surfing, OS snipping tools, and unauthorized screen recording.
  - Supports both **Press-and-Hold** and **Tap-to-Reveal** with auto-conceal countdown timers.
  - Quick 1-tap **Veil ON/OFF** controls visible on all desktop and mobile viewports.
  - Document blur, visibility change detection, right-click locking, and clipboard scrambling.
- **Instant Departure Detection**:
  - Real-time notification when a chat partner leaves, closes the tab, or disconnects.
  - Visual status changes (red offline indicator, departure banner, conversation ended prompt).
  - Audible departure chime.
- **Resilient Mobile Lifecycle**:
  - Private room codes persist across mobile app-switching (e.g., copying codes to WhatsApp or Telegram).
  - Native Web Share API integration (`navigator.share`) for 1-tap code sharing.
  - Dual HTTP long-polling and WebSocket transport upgrade for reliable connection to cloud instances (e.g., Render cold starts).

---

## Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Real-time Client**: Socket.IO Client (polling + websocket transports)
- **Deployment**: Vercel

### Backend
- **Framework**: Python 3.14 + Flask
- **Real-time Engine**: Flask-SocketIO + Gunicorn (gthread worker)
- **Storage**: Redis (Render Redis / Upstash) with zero-dependency `InMemoryStore` fallback
- **Testing**: Pytest (19 comprehensive unit and integration test cases)
- **Deployment**: Render Web Service

---

## Project Structure

```
veilo/
├── backend/
│   ├── app/
│   │   ├── routes/          # REST API endpoints (/api/health, /api/session, /api/rooms)
│   │   ├── services/        # Room manager, matchmaking, cleanup, moderation
│   │   ├── utils/           # Room codes, tokens, validators
│   │   ├── config.py        # Environment configuration
│   │   ├── extensions.py    # SocketIO & Redis proxy with in-memory fallback
│   │   └── socket_events.py # Real-time Socket.IO event handlers
│   ├── tests/               # Pytest suite
│   ├── Procfile             # Gunicorn deployment config for Render
│   ├── requirements.txt     # Python dependencies
│   └── run.py               # WSGI entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # ChatWindow, MessageBubble, AntiCaptureShield, etc.
│   │   ├── hooks/           # useChat, useAntiCapture, useSocket
│   │   ├── pages/           # Home, RandomChat, PrivateChat, JoinRoom, Privacy
│   │   ├── services/        # Socket.IO client and REST API helpers
│   │   ├── App.jsx          # Main application & routing
│   │   └── index.css        # Global styles and Tailwind imports
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Running Locally

### Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python run.py
```
Backend runs on `http://localhost:5000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## Testing

Run the backend test suite:

```bash
cd backend
venv\Scripts\python -m pytest tests -v
```

All 19 test cases verify:
- Message sanitization and delivery
- Rate limiting and duplicate prevention
- Stranger matchmaking queue and blocking
- Private room code generation and validation
- Room capacity enforcement (2-user maximum)
- Immediate partner departure notifications
- Mobile disconnect room resilience
- Redis fallback and failover

---

## License

MIT License — free for open-source and commercial use.
