# AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace

An open-source, local security operations workstation designed for rapid forensic triage, evidence parsing, privilege-escalation detection, analyst adjudication, and automated incident reporting on Linux systems.

---

## Deployment & Environment URLs

### Deployed Services (Cloud Demo)
- **Live Frontend**: [https://ai-linux-investigation-frontend.onrender.com/](https://ai-linux-investigation-frontend.onrender.com/)
- **Live Backend API**: [https://ai-linux-investigation-workspace.onrender.com/](https://ai-linux-investigation-workspace.onrender.com/)

### Local Development Environment
- **Local Frontend**: [http://localhost:5173/](http://localhost:5173/)
- **Local Backend API**: [http://127.0.0.1:8010/](http://127.0.0.1:8010/) (fallback `http://localhost:8000/`)

### Source Control
- **GitHub Repository**: [https://github.com/Satya1135/ai-linux-investigation-workspace](https://github.com/Satya1135/ai-linux-investigation-workspace)

> [!NOTE]
> **Release Classification**: This project is currently released as a **Portfolio / Developer Demo v1.0.0 (Local Security Workstation MVP)**. It is intended for local forensic investigation, educational analysis, and security engineering demonstration. Review the [Security Notice & Current Limitations](#security-notice--current-limitations) below.

---

## Architecture & Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Tooling & Bundler**: Vite
- **Styling**: Vanilla CSS Modules with custom design tokens (Cybersecurity HUD theme: `#090d16` slate background, `#06b6d4` cyan accents, `#10b981` emerald highlights, `#f43f5e` rose alerts)
- **State Management & Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide Icons
- **Persistence**: Browser `localStorage` for offline, local case management

### Backend
- **Framework**: Python 3.11+ / FastAPI
- **Data Validation & Settings**: Pydantic v2 / Pydantic Settings
- **Detection & Investigation Engine**: Deterministic heuristic rules engine (multi-stage correlation: SUID backdoors, GTFOBins, sensitive credential store access, SSH brute-forcing, and `/tmp` staging). The current detection pipeline uses deterministic rules and does not invoke an LLM to generate findings; detections can still produce false positives or false negatives.
- **AI Core Status**: Scaffolded Anthropic Claude Pydantic schemas; all active investigation analysis is 100% deterministic and rule-based
- **Reporting**: Browser-native print-to-PDF (`@media print` CSS) and standalone sanitized HTML export (`escapeHtml` protection)

### Testing & Verification
- **Backend Testing**: 71 automated Pytest unit and integration tests (100% passing)
- **Report Verification**: 13 automated Node.js report verification tests (`scripts/verify_reports.mjs`, 100% passing)
- **Frontend Verification**: TypeScript strict mode (`tsc --noEmit`) and Vite production bundler (0 errors)

---

## Project Structure

```
ai-linux-investigation-workspace/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── cases/          # Case cards, lists, and status badges
│       │   ├── evidence/       # Evidence upload & sample loader
│       │   ├── investigation/  # Analysis triggers, verdict banners, finding cards
│       │   ├── reports/        # 8-section report viewer & print styling
│       │   └── common/         # Header, responsive Sidebar, mobile drawer
│       ├── pages/              # Dashboard, EvidenceIntake, TimelineView, Investigation, CaseManagement, ReportView
│       ├── services/           # api.ts, caseStorage.ts, reportGenerator.ts
│       ├── styles/             # variables.css & cyber defense tokens
│       └── main.tsx
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/             # /health, /evidence, /timeline, /investigation
│   │   ├── core/               # config.py, settings, CORS origins
│   │   ├── schemas/            # Pydantic v2 request/response contracts
│   │   ├── services/
│   │   │   ├── evidence/       # Ingestion, SHA-256 hashing, path traversal checks
│   │   │   ├── timeline/       # Timestamp normalization & stage tagging
│   │   │   └── investigation/  # Deterministic heuristic correlation engine
│   │   └── main.py             # FastAPI entrypoint
│   └── tests/
│       ├── unit/               # Health, evidence, timeline, investigation tests
│       └── integration/        # Full API flow and edge case tests
│
├── docs/                       # Technical architecture, retrospectives & roadmap
├── sample-data/linux/          # Realistic Linux attack telemetry scenarios
├── scripts/                    # verify_reports.mjs & operational utilities
├── .env.example
├── .gitignore
├── README.md
└── LICENSE                     # MIT License
```

---

## Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js**: v18+ (tested on v20 and v22)
- **Python**: 3.10+ (tested on Python 3.12)
- **Operating System**: Windows (PowerShell), macOS, or Linux

### 2. Backend Setup
```powershell
# From repository root:
# 1. Create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Start the FastAPI development server
# Default port 8010 avoids local port 8000 conflicts:
uvicorn backend.app.main:app --host 127.0.0.1 --port 8010
```
Verify backend health in another terminal:
```powershell
curl http://127.0.0.1:8010/health
# Response: {"status":"ok"}
```

### 3. Frontend Setup
```powershell
# In a separate terminal, navigate to frontend:
cd frontend

# 1. Install dependencies
npm install

# 2. Configure local backend URL (if using port 8010):
# Create or edit frontend/.env.local:
# VITE_API_URL=http://localhost:8010

# 3. Start Vite dev server
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## Running Verification Tests

Run the full automated test suite locally to verify complete workspace integrity:

```powershell
# 1. Run all backend tests (71 passing tests)
.\.venv\Scripts\python -m pytest backend/tests -q

# 2. Run automated report generation verification (13 passing tests)
node scripts/verify_reports.mjs

# 3. Verify frontend production build (0 TypeScript or bundle errors)
cd frontend
npm run build
```

---

## Core Investigation Workflow

1. **Evidence Ingestion**: Upload plain-text Linux log files (`auth.log`, `syslog`, `auditd`) or click **Analyze Sample Scenario** to load the pre-packaged 30-event multi-stage privilege escalation scenario. The backend computes a SHA-256 evidence fingerprint supporting traceability and extracts normalized event lines without executing untrusted strings (as an evidence fingerprint, SHA-256 supports audit traceability and integrity checks against post-intake modification, but does not independently prove external origin authenticity or prevent evidence tampering prior to upload).
2. **Timeline Sequencing**: Events are sorted chronologically, tagged by attack stage (`AUTHENTICATION`, `EXECUTION`, `PRIVILEGE_ESCALATION`, `PERSISTENCE`), and flagged for suspicious anomalies.
3. **Deterministic Correlation**: The 5-stage rule engine analyzes sequence patterns against MITRE ATT&CK techniques, generating seven grounded findings with mathematical confidence scores, supporting event IDs, and exact log line numbers. The current detection pipeline uses deterministic rules and does not invoke an LLM to generate findings; detections can still produce false positives or false negatives.
4. **Analyst Review**: Adjudicate findings as `CONFIRMED`, `REJECTED`, `EDITED`, or `PENDING`. Add finding-level rationale and case-level directives.
5. **Case Management**: Save investigation cases to the browser profile (`LIN-YYYYMMDD-XXXXX` format). Search, filter by review status, reopen, or edit records offline.
6. **Incident Reporting**: Generate formal 8-section incident reports. Export as a standalone sanitized `.html` file with embedded styles or export to print-ready PDF via browser `window.print()` with `@media print` A4 pagination.

---

## Security Notice & Current Limitations

This software is currently in **Portfolio / Demo MVP (v1.0.0)** status. While local data processing and export workflows are rigorously hardened, the following limitations must be recognized:

1. **Unauthenticated API Endpoints**: Backend endpoints (`/api/v1/evidence/*`, `/api/v1/investigation/*`) currently do not require authentication tokens. The API relies on local network binding (`127.0.0.1`) and CORS origin whitelisting.
2. **No Rate Limiting**: The backend does not currently implement request rate limiting or IP throttling on upload and analysis endpoints.
3. **Browser-Local Storage**: Case records are stored strictly in the analyst's browser profile via `localStorage`. Clearing site cache removes saved cases, and cases do not synchronize across devices.
4. **Deterministic Heuristics Only**: Active threat detection is entirely deterministic. No live Anthropic Claude API calls are executed during standard triage; Claude schemas exist for future bounded narrative drafting. Detections can produce false positives or false negatives.
5. **Single-Node Tooling**: Designed for individual analyst workstations, not multi-tenant enterprise SOC deployments.

See [`docs/future-scope.md`](file:///e:/PROJECTS/ai-linux-investigation-workspace-backup/docs/future-scope.md) for the planned 3-, 6-, and 12-month security roadmap to address these boundaries.

---

## Project Documentation Suite

Comprehensive engineering documentation is available in the [`docs/`](file:///e:/PROJECTS/ai-linux-investigation-workspace-backup/docs) directory:

- [Setup & Installation Guide](docs/SETUP.md) — Local runtime prerequisites and dependencies
- [Environment Configuration Guide](docs/ENVIRONMENT.md) — Environment variables and zero-secrets isolation rules
- [Project Structure Details](docs/PROJECT-STRUCTURE.md) — Directory layout and architectural boundaries
- [Day 4 Evidence Intake](docs/DAY4-EVIDENCE-INTAKE.md) — Log upload, line indexing, and SHA-256 verification
- [Day 5 Timeline Investigation](docs/DAY5-TIMELINE.md) — Chronological sequencing and attack stages
- [Day 6 Investigation Pipeline](docs/DAY6-INVESTIGATION-PIPELINE.md) — 5-stage correlation engine & MITRE mapping
- [Day 7 Case Management](docs/DAY7-CASE-MANAGEMENT.md) — Analyst review workflows and `localStorage` persistence
- [Day 8 Final Incident Reports](docs/DAY8-REPORTS.md) — 8-section report viewer, HTML export, and PDF print pagination
- [Challenge Retrospective (Days 1–10)](docs/challenge-retrospective.md) — Chronological retrospective, architectural pivots, debugging lessons, and test results
- [Future Scope & Vision](docs/future-scope.md) — 3-, 6-, and 12-month security, persistence, and detection roadmap
- [30-Day Growth Plan](docs/30-day-growth-plan.md) — Sequential 30-day milestone implementation plan across 4 phases
- [Reusable Daily Build Prompt](docs/daily-build-prompt.md) — Parameterized daily prompt template for Antigravity AI pair programming
- [Portfolio & Presentation Kit](docs/portfolio-kit.md) — Resume bullets, talking points, demo script, and GitHub metadata

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
