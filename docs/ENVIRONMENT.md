# Environment Configuration Guide

This document describes the environment variables required to configure the **AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace**.

> [!IMPORTANT]
> **Zero Secrets Policy**: Never commit `.env` or any production secrets, service role keys, or Anthropic API keys to version control. The `.gitignore` file is configured to strictly ignore all `.env` files except `.env.example`.

---

## Configuration Files

The project includes template files:
- Root template: [`.env.example`](file:///e:/PROJECTS/ai-linux-investigation-workspace/.env.example)
- Frontend template: [`frontend/.env.example`](file:///e:/PROJECTS/ai-linux-investigation-workspace/frontend/.env.example)

To configure your local environment:
```bash
# In the project root:
cp .env.example .env

# In the frontend directory:
cp frontend/.env.example frontend/.env
```

---

## Backend Environment Variables

The backend uses `pydantic-settings` to automatically validate and load environment variables from the environment and the `.env` file located at the repository root.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | string | `AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace` | Application display name |
| `ENVIRONMENT` | string | `development` | Deployment environment (`development`, `staging`, `production`) |
| `DEBUG` | boolean | `True` | Enables debug logging and interactive OpenAPI docs |
| `PORT` | integer | `8000` | Port for the Uvicorn web server |
| `HOST` | string | `0.0.0.0` | Host bind address |
| `API_V1_STR` | string | `/api/v1` | URL prefix for version 1 API endpoints |
| `BACKEND_CORS_ORIGINS` | list / string | `["http://localhost:5173", ...]` | Allowed CORS origins for the frontend (JSON array or comma-separated) |
| `DATABASE_URL` | string | `""` | Supabase / PostgreSQL direct connection URI |
| `SUPABASE_URL` | string | `""` | Supabase project API URL (e.g., `https://xyz.supabase.co`) |
| `SUPABASE_ANON_KEY` | string | `""` | Supabase client anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | string | `""` | Supabase service-role secret key (Backend only) |
| `ANTHROPIC_API_KEY` | string | `""` | Anthropic Claude API Key (Backend only) |
| `ANTHROPIC_MODEL` | string | `claude-3-5-sonnet-20241022` | Configurable model identifier for Claude |

### Evidence Intake Operational Constants

The evidence intake service enforces strict security thresholds configured in the backend runtime:
- **Maximum Payload Size**: 5 MB (`5,242,880` bytes)
- **Permitted File Extensions**: `.log`, `.txt` (case-insensitive)
- **Disallowed Executables/Scripts**: `.exe`, `.bat`, `.cmd`, `.ps1`, `.sh`, `.py`, `.js`, `.zip`, arbitrary binary files
- **Input Type Boundaries**: Plain-text logs only; binary contents (null bytes) are rejected immediately.


---

## Frontend Environment Variables

Vite exposes environment variables prefixed with `VITE_` to the client-side bundle via `import.meta.env`.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | string | `http://localhost:8000` | Base URL of the FastAPI backend service |
| `VITE_SUPABASE_URL` | string | `""` | Supabase project URL for client-side Auth |
| `VITE_SUPABASE_ANON_KEY` | string | `""` | Supabase public anonymous API key |

> [!CAUTION]
> Never expose `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` to the frontend with `VITE_` prefixes. AI generation and privileged DB queries are strictly backend-mediated.
