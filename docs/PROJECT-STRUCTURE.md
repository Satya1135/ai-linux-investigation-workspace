# Project Structure Documentation

This document describes the actual directory structure created for the **AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace**, reflecting the Day 3 foundation state.

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
│       │   │   └── CasesPlaceholder.tsx # Cases table view foundation (mock data preview)
│       │   ├── evidence/                # (Day 4: log ingestion & parsing components)
│       │   ├── investigation/           # (Day 5+: malware & priv-esc detection UI)
│       │   ├── findings/                # (Day 6+: findings & MITRE ATT&CK mapping UI)
│       │   ├── reports/                 # (Day 8+: report generation UI)
│       │   └── common/
│       │       ├── Header.tsx           # Global header with live backend status badge
│       │       ├── Header.module.css    # Glassmorphic header styles
│       │       ├── Sidebar.tsx          # Collapsible navigation sidebar
│       │       └── Sidebar.module.css   # Dark cybersecurity sidebar styling
│       ├── pages/
│       │   ├── Dashboard.tsx            # Main workspace overview & architecture matrix
│       │   └── Dashboard.module.css     # Metric cards, grid layout, chips, and table styles
│       ├── hooks/                       # Custom React hooks (Day 4+)
│       ├── services/
│       │   └── api.ts                   # API client, configurable base URL, /health fetcher
│       ├── types/
│       │   └── index.ts                 # Domain and UI TypeScript interfaces
│       └── styles/
│           ├── variables.css            # CSS variables design system (dark cyber palette)
│           └── global.css               # CSS reset, typography, and scrollbar styling
│
├── backend/                             # Python FastAPI service
│   ├── requirements.txt                 # Backend dependencies (fastapi, uvicorn, pydantic, etc.)
│   ├── app/
│   │   ├── __init__.py                  # App package initialization
│   │   ├── main.py                      # FastAPI app instance, CORS middleware, router registration
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │       ├── __init__.py          # Routes package exporter
│   │   │       └── health.py            # GET /health endpoint returning {"status": "ok"}
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py                # Pydantic Settings reading .env and environment variables
│   │   ├── models/                      # Database models (Day 4+)
│   │   │   └── __init__.py
│   │   ├── schemas/                     # Pydantic validation schemas (Day 4+)
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── cases/                   # Case management business logic (Day 4+)
│   │   │   │   └── __init__.py
│   │   │   ├── evidence/                # Evidence artifact ingestion logic (Day 4+)
│   │   │   │   └── __init__.py
│   │   │   ├── investigation/           # Malware & Priv-Esc detection engines (Day 5+)
│   │   │   │   └── __init__.py
│   │   │   ├── ai/                      # Anthropic Claude prompt orchestration (Day 7+)
│   │   │   │   └── __init__.py
│   │   │   └── reports/                 # WeasyPrint PDF report generation (Day 8+)
│   │   │       └── __init__.py
│   │   └── db/                          # Database connection and session management (Day 4+)
│   │       └── __init__.py
│   └── tests/                           # Pytest testing suite
│       ├── __init__.py
│       ├── fixtures/                    # Test data fixtures (.gitkeep)
│       ├── integration/                 # Integration tests (.gitkeep)
│       └── unit/
│           ├── __init__.py
│           └── test_health.py           # Unit tests for /health, /api/v1/health, /, and async client
│
├── docs/                                # Project documentation
│   ├── SETUP.md                         # Detailed developer installation and execution instructions
│   ├── ENVIRONMENT.md                   # Environment variables specification
│   ├── PROJECT-STRUCTURE.md             # This document
│   └── DAY3-SUMMARY.md                  # Comprehensive summary of Day 3 accomplishments
│
├── sample-data/                         # Sample datasets and logs for testing
│   └── linux/                           # Raw Linux logs (syslog, auth.log, cron, auditd)
│       └── .gitkeep
│
└── scripts/                             # Utility and operational scripts
    └── .gitkeep
```

---

## Directory Responsibilities

| Path | Purpose |
| :--- | :--- |
| `frontend/src/app` | Root React application container, providers, and layout structure |
| `frontend/src/components/common` | Global UI components (navigation, header, status badges) |
| `frontend/src/components/cases` | Case visualization and management components |
| `frontend/src/pages` | Primary route views (Dashboard, Cases Overview) |
| `frontend/src/services` | HTTP networking layer and API clients |
| `frontend/src/styles` | CSS design system variables and global styling |
| `backend/app/api/routes` | HTTP API route handlers grouped by domain |
| `backend/app/core` | Application configuration and core infrastructure |
| `backend/app/services` | Domain-specific business logic and analytical engines |
| `backend/tests` | Pytest test suite covering unit and integration testing |
| `docs/` | System specifications, architecture records, and setup guides |
