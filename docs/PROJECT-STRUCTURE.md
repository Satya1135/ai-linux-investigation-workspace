# Project Structure Documentation

This document describes the actual directory structure of the **AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace**, reflecting the architecture and multi-milestone implementation through Day 9.

---

## Workspace Root Tree

```
ai-linux-investigation-workspace/
├── .github/
│   └── workflows/                       # CI/CD GitHub Actions workflows
│       └── .gitkeep
├── .env.example                         # Root environment configuration template
├── .gitignore                           # Git ignore rules for Python, Node, secrets, logs
├── LICENSE                              # MIT Open Source License
├── README.md                            # Project overview, tech stack, and quick start guide
├── pytest.ini                           # Pytest configuration (pythonpath, testpaths, asyncio)
│
├── frontend/                            # React + Vite + TypeScript application
│   ├── .env.example                     # Frontend-specific environment template
│   ├── index.html                       # HTML5 entry template with dark cybersecurity theme
│   ├── package.json                     # Frontend dependencies, scripts, and build targets
│   ├── package-lock.json                # Locked npm dependency graph
│   ├── tsconfig.json                    # TypeScript compiler options
│   ├── tsconfig.node.json               # TypeScript config for Vite tooling
│   ├── vite.config.ts                   # Vite configuration (port 5173, React plugin)
│   ├── public/
│   │   └── vite.svg                     # Cyber shield application icon
│   └── src/
│       ├── main.tsx                     # Application bootstrap and React DOM render
│       ├── vite-env.d.ts                # Ambient Vite types and environment declarations
│       ├── app/
│       │   ├── App.tsx                  # App shell, navigation state, QueryClientProvider
│       │   └── App.module.css           # Workspace responsive layout styles
│       ├── components/
│       │   ├── cases/
│       │   │   └── CasesPlaceholder.tsx # Saved cases dashboard widget & navigation link
│       │   ├── evidence/                # Evidence intake panels (Upload, Paste, Sample, Raw Preview)
│       │   ├── investigation/           # Timeline investigation cards, event filters, time-delta badges
│       │   ├── findings/                # Detection findings, MITRE ATT&CK badges, review state toggles
│       │   ├── reports/                 # Executive report preview, print-to-PDF triggers, HTML export
│       │   └── common/
│       │       ├── Header.tsx           # Global header with live backend status badge
│       │       ├── Header.module.css    # Glassmorphic header styles
│       │       ├── Sidebar.tsx          # Collapsible navigation sidebar
│       │       ├── Sidebar.module.css   # Dark cybersecurity sidebar styling
│       │       ├── Footer.tsx           # Platform footer with copyright and system status
│       │       └── Footer.module.css    # Footer layout styles
│       ├── pages/
│       │   ├── Dashboard.tsx            # Security Operations Cockpit, metrics, architecture matrix
│       │   ├── Dashboard.module.css     # Metric cards, grid layout, chips, and table styles
│       │   ├── EvidenceIntake.tsx       # Evidence intake view (upload, paste, synthetic samples)
│       │   ├── EvidenceIntake.module.css # Styling for evidence intake panels & event viewer
│       │   ├── InvestigationTimeline.tsx # Chronological forensic event timeline & delta analysis
│       │   ├── InvestigationTimeline.module.css # Timeline styling, event chips, and filter controls
│       │   ├── InvestigationAnalysis.tsx # Deterministic heuristic detection pipeline & analyst review
│       │   ├── InvestigationAnalysis.module.css # Analysis layout, verdict banners, finding cards
│       │   ├── CaseManagement.tsx       # Browser-local case storage viewer, search, re-open, notes
│       │   ├── CaseManagement.module.css # Case management table and action buttons
│       │   ├── Reports.tsx              # Executive forensic incident reports & print/export view
│       │   └── Reports.module.css       # Reports layout and case selector
│       ├── hooks/                       # Custom React hooks
│       ├── services/
│       │   ├── api.ts                   # API client, configurable base URL, /health & forensic routes
│       │   ├── caseStorage.ts           # Browser-local storage read/write for saved cases
│       │   └── reportGenerator.ts       # Report model synthesis, XSS escaping, HTML export builder
│       ├── types/
│       │   └── index.ts                 # Domain and UI TypeScript interfaces
│       └── styles/
│           ├── variables.css            # CSS variables design system (dark cyber palette)
│           └── global.css               # CSS reset, typography, print styles, and scrollbar styling
│
├── backend/                             # Python FastAPI service
│   ├── requirements.txt                 # Backend dependencies (fastapi, uvicorn, pydantic, python-multipart, etc.)
│   ├── app/
│   │   ├── __init__.py                  # App package initialization
│   │   ├── main.py                      # FastAPI app instance, CORS middleware, router registration
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │       ├── __init__.py          # Routes package exporter
│   │   │       ├── health.py            # GET /health and /api/v1/health endpoints
│   │   │       ├── evidence.py          # Evidence intake endpoints (/upload, /paste, /sample, /samples)
│   │   │       ├── timeline.py          # Timeline analysis endpoint (/api/v1/timeline/analyze)
│   │   │       └── investigation.py     # Investigation pipeline endpoints (/analyze, /enrich)
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py                # Pydantic Settings reading .env, CORS origins configuration
│   │   ├── models/                      # Database models (configured for future persistence)
│   │   │   └── __init__.py
│   │   ├── schemas/                     # Pydantic validation schemas
│   │   │   ├── __init__.py              # Schema exports
│   │   │   ├── evidence.py              # Evidence schemas (Intake, Metadata, Event Candidates, Responses)
│   │   │   ├── timeline.py              # Timeline event schemas and request/response models
│   │   │   └── investigation.py         # Findings, verdicts, MITRE ATT&CK techniques, enrichment schemas
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── cases/                   # Case management business logic
│   │   │   │   └── __init__.py
│   │   │   ├── evidence/                # Evidence intake & normalization service
│   │   │   │   ├── __init__.py          # Service and exceptions export
│   │   │   │   ├── service.py           # EvidenceService, path defense, safe normalization
│   │   │   │   └── exceptions.py        # Evidence domain exceptions
│   │   │   ├── timeline/                # Forensic timeline processing service
│   │   │   │   ├── __init__.py          # Timeline service exports
│   │   │   │   ├── service.py           # TimelineService, chronological sequencing, delta calculations
│   │   │   │   └── exceptions.py        # Timeline domain exceptions
│   │   │   ├── investigation/           # Deterministic heuristic detection pipeline
│   │   │   │   ├── __init__.py          # Investigation service exports
│   │   │   │   ├── service.py           # InvestigationService, MITRE ATT&CK rule evaluation
│   │   │   │   └── exceptions.py        # Investigation domain exceptions
│   │   │   ├── ai/                      # AI integration scaffold (Claude prompts & schemas)
│   │   │   │   └── __init__.py
│   │   │   └── reports/                 # Reporting architecture models
│   │   │       └── __init__.py
│   │   └── db/                          # Database connection and session management
│   │       └── __init__.py
│   └── tests/                           # Pytest testing suite (71 passing tests)
│       ├── __init__.py
│       ├── fixtures/                    # Test data fixtures
│       ├── integration/                 # API integration tests
│       │   ├── __init__.py
│       │   ├── test_evidence_api.py     # API integration tests (/api/v1/evidence/*)
│       │   ├── test_timeline_api.py     # API integration tests (/api/v1/timeline/*)
│       │   └── test_investigation_api.py # API integration tests (/api/v1/investigation/*)
│       └── unit/
│           ├── __init__.py
│           ├── test_health.py           # Unit tests for /health, CORS origins, and preflights
│           ├── test_evidence_service.py # Unit tests for EvidenceService, path defense, and normalization
│           ├── test_timeline_service.py # Unit tests for TimelineService, sorting, and delta math
│           ├── test_investigation_service.py # Unit tests for heuristic detection and MITRE mapping
│           └── test_report_data.py      # Unit tests for report data structures and formatting
│
├── docs/                                # Project documentation
│   ├── SETUP.md                         # Detailed developer installation and execution instructions
│   ├── ENVIRONMENT.md                   # Environment variables specification
│   ├── PROJECT-STRUCTURE.md             # This document
│   ├── DAY3-SUMMARY.md                  # Comprehensive summary of Day 3 accomplishments
│   ├── DAY4-EVIDENCE-INTAKE.md          # Architecture and validation spec for Day 4 Evidence Intake
│   ├── DAY4-FINAL-VERIFICATION.md       # Final verification checklist and Day 4 completion record
│   ├── DAY5-TIMELINE.md                 # Timeline architecture and verification record
│   ├── DAY5-FINAL-VERIFICATION.md       # Final verification checklist for Day 5
│   ├── DAY6-INVESTIGATION-PIPELINE.md   # Defensive investigation heuristics & detection pipeline
│   ├── DAY6-INVESTIGATION-UI.md         # Forensic investigation UI documentation
│   ├── DAY6-INTEGRATION-VERIFICATION.md # Integration verification for Day 6
│   ├── DAY7-CASE-MANAGEMENT.md          # Case management & browser-local storage specification
│   ├── DAY8-REPORTS.md                  # Executive incident reporting & print/export specification
│   └── THEME-REFINEMENT.md              # Cybersecurity UI theme and visual tokens guide
│
├── sample-data/                         # Sample datasets and logs for testing
│   └── linux/                           # Raw Linux logs (syslog, auth.log, cron, auditd)
│       ├── .gitkeep
│       └── sample-privilege-escalation.log # Synthetic privilege escalation security incident log
│
└── scripts/                             # Utility and operational scripts
    ├── verify_frontend_api.mjs          # Integration script for Evidence Intake API
    └── verify_reports.mjs               # Automated verification test suite for Day 8 reports
```

---

## Directory Responsibilities

| Path | Purpose |
| :--- | :--- |
| `frontend/src/app` | Root React application container, tab navigation router, and query client provider |
| `frontend/src/components/common` | Global UI components (header, sidebar, footer, status badges) |
| `frontend/src/components/cases` | Saved case widgets and case overview components |
| `frontend/src/components/evidence` | Evidence upload, raw log paste, and sample scenario intake components |
| `frontend/src/components/investigation` | Timeline cards, delta badges, and chronological filtering controls |
| `frontend/src/components/findings` | Heuristic detection cards, MITRE ATT&CK badges, analyst verdict review controls |
| `frontend/src/components/reports` | Executive report presentation, browser-native print-to-PDF, and standalone HTML download |
| `frontend/src/pages` | Primary workspace view controllers (Dashboard, Evidence, Timeline, Analysis, Case Management, Reports) |
| `frontend/src/services` | Networking client (`api.ts`), local case storage (`caseStorage.ts`), report compilation (`reportGenerator.ts`) |
| `frontend/src/styles` | Cyber defense design system variables, global reset, and print pagination styles |
| `backend/app/api/routes` | FastAPI route controllers for health, evidence intake, timeline analysis, and detection |
| `backend/app/core` | Application settings, CORS origin restrictions, and environment validation |
| `backend/app/services` | Analytical engines: evidence normalization, path defense, timeline deltas, heuristic detection rules |
| `backend/tests` | Full Pytest test suite covering unit and integration verification (71 tests) |
| `docs/` | System specifications, milestone reports, environment specs, and architecture records |
| `scripts/` | Standalone verification scripts for evidence API and executive reports |
