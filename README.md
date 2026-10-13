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
- **Database & Auth**: Supabase PostgreSQL & Supabase Auth (Configured, auth enforcement pending architecture approval)
- **Detection & Investigation Engine**: Deterministic heuristic rules engine (privilege escalation & suspicious activity detection)
- **AI Core**: Anthropic Claude API integration scaffold (Backend schema ready; heuristic analysis active)
- **Reporting**: Browser-native print-to-PDF & standalone HTML export with self-contained styles

### Testing & Quality
- **Backend Testing**: Pytest, HTTPX (71+ unit & integration tests)
- **Report Verification**: Automated Node.js verification suite (`scripts/verify_reports.mjs`)
- **Frontend Verification**: TypeScript strict mode (`tsc`) & Vite production bundler

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
- [Day 4 Evidence Intake](docs/DAY4-EVIDENCE-INTAKE.md)
- [Day 5 Timeline Investigation](docs/DAY5-TIMELINE.md)
- [Day 6 Investigation Pipeline](docs/DAY6-INVESTIGATION-PIPELINE.md)
- [Day 7 Case Management](docs/DAY7-CASE-MANAGEMENT.md)
- [Day 8 Final Incident Reports & PDF Export](docs/DAY8-REPORTS.md)

---

## Current Status & Capabilities
- [x] **Day 3 — Project Foundation**: FastAPI backend (`/health`), React 18 + Vite frontend, cybersecurity design system, TanStack Query.
- [x] **Day 4 — Evidence Intake**: Linux log upload (.log, .txt up to 5 MB), log paste, synthetic sample scenario loading, deterministic SHA-256 integrity verification, safe line normalization, and candidate event extraction without code execution.
- [x] **Day 5 — Timeline Investigation**: Chronological event ordering, time delta analysis, multi-type event categorization, and interactive timeline filtering.
- [x] **Day 6 — Defensive Investigation Pipeline**: Deterministic detection pipeline identifying privilege escalation, suspicious sudo usage, persistence, and brute force patterns with MITRE ATT&CK mapping.
- [x] **Day 7 — Analyst Case Management**: Persistent browser-local case storage, finding review workflows (CONFIRMED, REJECTED, EDITED, PENDING), and case notes.
- [x] **Day 8 — Incident Reports & PDF Export**: Executive summary synthesis, verdict classification, timeline integration, HTML injection escaping, browser-native print-to-PDF with print-optimized CSS pagination, and standalone self-contained HTML export.
- [x] **Day 9 — Security Hardening & Alignment**: CORS origin restrictions (Render production frontend + localhost), strict sample path traversal rejection (`Path.is_relative_to` boundary checks), and dashboard synchronization.
