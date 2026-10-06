# AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace

An advanced security operations platform designed for rapid forensic triage, evidence parsing, privilege-escalation detection, and automated incident reporting on Linux systems.

---

## Architecture & Technology Stack

### Frontend
- **Framework**: React 18 / 19 with TypeScript
- **Bundler / Tooling**: Vite
- **Styling**: Vanilla CSS Modules & CSS variables (Sleek dark-mode cybersecurity theme)
- **Data Fetching / State**: TanStack Query (React Query)
- **Icons**: Lucide Icons

### Backend
- **Framework**: Python 3.12+ / FastAPI
- **Data Validation & Settings**: Pydantic v2 / Pydantic Settings
- **Database & Auth**: Supabase PostgreSQL & Supabase Auth
- **AI Engine**: Anthropic Claude API (Backend-mediated, configurable model)
- **Reporting**: WeasyPrint PDF Engine

### Testing & Quality
- **Backend Testing**: Pytest, HTTPX
- **End-to-End Testing**: Playwright

---

## Project Structure

```
ai-linux-investigation-workspace/
├── frontend/
│   ├── public/
│   └── src/
│       ├── app/
│       ├── components/
│       │   ├── cases/
│       │   ├── evidence/
│       │   ├── investigation/
│       │   ├── findings/
│       │   ├── reports/
│       │   └── common/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       ├── styles/
│       └── main.tsx
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── evidence/
│   │   │   ├── investigation/
│   │   │   ├── ai/
│   │   │   ├── reports/
│   │   │   └── cases/
│   │   ├── db/
│   │   └── main.py
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── fixtures/
│
├── docs/
├── sample-data/
│   └── linux/
├── scripts/
├── .github/
│   └── workflows/
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
```

---

## Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22+)
- **Python**: 3.10+ (tested on 3.12+)

### 2. Backend Setup
```bash
# From project root:
# Activate virtual environment
# Windows:
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Run backend development server
uvicorn backend.app.main:app --reload --port 8000
```
Verify the backend health check:
```bash
curl http://localhost:8000/health
# Response: {"status":"ok"}
```

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Documentation
- [Setup & Installation Guide](docs/SETUP.md)
- [Environment Configuration](docs/ENVIRONMENT.md)
- [Project Structure Details](docs/PROJECT-STRUCTURE.md)
- [Day 3 Progress Summary](docs/DAY3-SUMMARY.md)

---

## Current Status (Day 3)
- [x] Approved directory structure initialized
- [x] Backend FastAPI application created with `/health` endpoint
- [x] Backend test suite configured with Pytest & HTTPX
- [x] Frontend React + Vite + TypeScript application initialized
- [x] TanStack Query integrated
- [x] Dark cybersecurity UI design system & responsive layout shell created
- [x] Environment configuration templates established
