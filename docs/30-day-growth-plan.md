# 30-Day Growth Plan & Implementation Roadmap

**Project**: AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace
**Document**: Day-by-Day Milestone Specification (Days 1 Through 30)
**Target Architecture**: React 18 / TypeScript, FastAPI, Python 3.11+, Deterministic Detection Engine, SQLite/PostgreSQL
**Tooling Requirement**: 100% Free & Open-Source Tools (No Paid APIs or Cloud Subscriptions Required)

---

## Roadmap Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Security & Engineering Foundations (Days 1–7)                 │
│ └─ API Authentication, RBAC, Rate Limiting, Payload Hardening, UI Auth │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Evidence Pipeline, Case Persistence & Quality (Days 8–14)    │
│ └─ Async Database, Case CRUD API, Schema Migration, Benchmark Dataset  │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Responsible AI-Assisted Investigation (Days 15–21)            │
│ └─ Opt-In LLM Architecture, PII Scrubbing, Bounded Summaries, Budgets  │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Automation, Deployment & Portfolio Delivery (Days 22–30)      │
│ └─ CI Workflows, Docker, Playwright E2E, Scenarios, Final Release      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Security & Engineering Foundations (Days 1–7)

### Day 1: Token-Based API Authentication Architecture
- **Goal**: Implement secure user credential verification and JWT token generation on the FastAPI backend.
- **Concrete Deliverable**:
  - `backend/app/core/security.py` with password hashing (`pwd_context` using `passlib[bcrypt]` or `argon2-cffi`) and JWT encoding/decoding.
  - `/api/v1/auth/login` endpoint issuing JSON Web Tokens.
- **Acceptance Criteria**:
  - Passwords are never stored or compared in plain text.
  - Successful login returns a valid Bearer JWT containing user ID, username, and role with a 15-minute expiration.
  - Invalid credentials return HTTP 401 with a sanitized error message.
- **Tests or Verification**:
  - Unit tests in `backend/tests/unit/test_auth.py` validating token issuance, signature verification, and expiration failure.
  - `python -m pytest backend/tests/unit/test_auth.py` passes with 100%.

---

### Day 2: Role-Based Authorization & Protected API Endpoints
- **Goal**: Enforce authentication and RBAC dependencies across all evidence intake and investigation API endpoints.
- **Concrete Deliverable**:
  - FastAPI dependency `get_current_active_user` and `require_role(["analyst", "admin"])` in `backend/app/api/deps.py`.
  - Enforce dependencies on `/api/v1/evidence/*` and `/api/v1/investigation/*`.
- **Acceptance Criteria**:
  - Unauthenticated requests to protected endpoints return HTTP 401 Unauthorized.
  - Public endpoints (`/health`, `/api/v1/health`, `/api/v1/auth/login`) remain accessible without credentials.
  - Users with valid tokens receive normal JSON responses.
- **Tests or Verification**:
  - Integration tests in `backend/tests/integration/test_protected_endpoints.py` testing unauthenticated, invalid token, and valid token access.
  - Full suite `python -m pytest` passes without breaking existing Day 9 tests.

---

### Day 3: Rate Limiting & Abuse Protection
- **Goal**: Prevent API saturation, brute-force attacks, and denial-of-service attempts using request rate limiting.
- **Concrete Deliverable**:
  - Integration of `slowapi` rate limiter in `backend/app/core/rate_limit.py` with in-memory storage.
  - Route decorators enforcing 5 requests/minute on `/api/v1/auth/login` and 30 requests/minute on `/api/v1/investigation/analyze`.
- **Acceptance Criteria**:
  - Rapid bursts exceeding configured limits return HTTP 429 Too Many Requests.
  - Responses include `Retry-After` header indicating cooldown time.
  - Health checks remain unthrottled for monitoring probes.
- **Tests or Verification**:
  - Test in `backend/tests/unit/test_rate_limiting.py` simulating 6 rapid login requests and asserting HTTP 429 on the 6th call.

---

### Day 4: Request Payload Hardening & Upload Size Boundaries
- **Goal**: Protect backend memory from exhaustion by enforcing strict upload payload limits and input sanitization.
- **Concrete Deliverable**:
  - Middleware / dependency enforcing maximum 25 MB file size limit on multipart evidence uploads.
  - Validation restricting evidence file types to `.log`, `.txt`, `.audit`, and `.json`.
- **Acceptance Criteria**:
  - Uploads exceeding 25 MB are aborted immediately with HTTP 413 Payload Too Large before loading into memory.
  - Binary executables (e.g., ELF, PE) or disallowed extensions return HTTP 415 Unsupported Media Type.
- **Tests or Verification**:
  - Tests in `backend/tests/unit/test_upload_limits.py` uploading synthetic oversized files and invalid extensions.

---

### Day 5: Frontend Auth State & Token Interceptors
- **Goal**: Implement client-side authentication management and automatic Bearer token injection.
- **Concrete Deliverable**:
  - `frontend/src/context/AuthContext.tsx` providing `user`, `token`, `login()`, and `logout()`.
  - Fetch / API client wrapper in `frontend/src/services/api.ts` automatically appending `Authorization: Bearer <token>` to requests.
- **Acceptance Criteria**:
  - All outgoing API calls automatically include the Bearer token when an active session exists.
  - HTTP 401 responses automatically clear invalid tokens and trigger authentication state reset.
- **Tests or Verification**:
  - Manual verification in browser DevTools Network tab confirming `Authorization` header presence on API requests.

---

### Day 6: Frontend Login View & Session Storage
- **Goal**: Build an accessible, cybersecurity-themed login dialog and session persistence.
- **Concrete Deliverable**:
  - `frontend/src/components/auth/LoginModal.tsx` styled with cybersecurity HUD tokens (`#090d16`, `#06b6d4`).
  - Session restoration on app boot from `sessionStorage` (cleared on browser tab close for security).
  - User status badge and Logout button in `Header.tsx`.
- **Acceptance Criteria**:
  - Clean form with keyboard navigation, clear error indicators for invalid passwords, and loading spinners.
  - Logging out immediately disables investigation triggers and hides protected views.
- **Tests or Verification**:
  - `cd frontend && npm run build` compiles with 0 TypeScript errors.
  - Manual login and logout flow verified locally.

---

### Day 7: End-to-End Security Foundation Audit & Regression Verification
- **Goal**: Conduct a full regression and security audit of Phase 1 deliverables.
- **Concrete Deliverable**:
  - Automated security regression test script `scripts/verify_phase1_security.py`.
  - Documentation summary in `docs/PHASE1-VERIFICATION.md`.
- **Acceptance Criteria**:
  - All backend endpoints properly enforce either public or authenticated access rules.
  - Rate limiting triggers correctly on brute-force attempts.
  - All 71+ backend tests, 13 report verification tests, and frontend build pass with 100% success.
- **Tests or Verification**:
  - Run `python -m pytest`
  - Run `node scripts/verify_reports.mjs`
  - Run `npm run build` inside `frontend/`

---

## Phase 2: Evidence Pipeline, Case Persistence, and Detection Quality (Days 8–14)

### Day 8: Async Database Setup with SQLAlchemy & SQLite
- **Goal**: Introduce a persistent relational database layer with zero cloud infrastructure dependencies.
- **Concrete Deliverable**:
  - `backend/app/db/session.py` configuring SQLAlchemy 2.0 async engine (`sqlite+aiosqlite:///./investigation.db`).
  - Alembic configuration initialized in `backend/alembic/` for automated database migrations.
- **Acceptance Criteria**:
  - Database initializes automatically on server startup if the file does not exist.
  - Database connection pool functions asynchronously without blocking FastAPI event loop.
- **Tests or Verification**:
  - Unit test in `backend/tests/unit/test_db_connection.py` connecting, executing `SELECT 1`, and closing cleanly.

---

### Day 9: Database Models for Cases & Evidence Artifacts
- **Goal**: Define relational schemas for persistent investigation cases, findings, and evidence artifacts.
- **Concrete Deliverable**:
  - SQLAlchemy models in `backend/app/models/case.py`: `CaseModel`, `FindingModel`, `ReviewModel`, `EvidenceArtifactModel`.
  - Initial Alembic migration script generating all database tables.
- **Acceptance Criteria**:
  - Schema preserves all fields from Day 7/8 (`case_id`, `case_name`, `verdict`, `total_events_analyzed`, `reviews`, `analyst_notes`, `timeline`).
  - Foreign key constraints maintain relational integrity between cases and findings.
- **Tests or Verification**:
  - Run `alembic upgrade head` cleanly creates all tables in a scratch SQLite database.

---

### Day 10: Backend Case Management REST API
- **Goal**: Implement server-side CRUD endpoints for investigation cases.
- **Concrete Deliverable**:
  - Endpoints in `backend/app/api/v1/endpoints/cases.py`:
    - `GET /api/v1/cases` (list cases with pagination and status filters)
    - `POST /api/v1/cases` (create new case)
    - `GET /api/v1/cases/{case_id}` (fetch full case details)
    - `PUT /api/v1/cases/{case_id}` (update case metadata / reviews)
    - `DELETE /api/v1/cases/{case_id}` (delete case record)
- **Acceptance Criteria**:
  - Endpoints strictly enforce authentication and return Pydantic v2 serialized responses.
  - Deleting a case cascades safely to associated reviews and finding records.
- **Tests or Verification**:
  - Integration tests in `backend/tests/integration/test_cases_api.py` validating full CRUD lifecycle.

---

### Day 11: Frontend Migration from `localStorage` to Backend Case API
- **Goal**: Transition frontend case storage to the backend REST API while retaining local offline fallback.
- **Concrete Deliverable**:
  - Updated `frontend/src/services/caseStorage.ts` utilizing TanStack Query hooks fetching from `/api/v1/cases`.
  - Fallback logic: if backend is unreachable, app reads from browser `localStorage` and alerts analyst.
- **Acceptance Criteria**:
  - Cases saved in the browser persist across multiple devices and browsers connected to the backend.
  - Existing Day 8 HTML and PDF export workflows continue functioning seamlessly without data loss.
- **Tests or Verification**:
  - Manual creation of a case, browser refresh, and verification of persistence via backend API.

---

### Day 12: Enhanced Linux Log Parsers (Journald & Compressed Logs)
- **Goal**: Expand evidence ingestion capabilities to support modern systemd journals and compressed log files.
- **Concrete Deliverable**:
  - Parser for `systemd-journald` JSON export format in `backend/app/services/evidence/journal_parser.py`.
  - Ingestion support for `.gz` and `.tar.gz` compressed archives with decompression memory limits.
- **Acceptance Criteria**:
  - Compressed archives are decompressed in memory safely without creating temporary disk clutter.
  - JSON journal entries normalize cleanly into standard `NormalizedLogEvent` models.
- **Tests or Verification**:
  - Unit tests in `backend/tests/unit/test_journal_parser.py` parsing sample compressed log files.

---

### Day 13: Declarative Threat Detection Rule Specification
- **Goal**: Decouple detection rules from hardcoded Python logic into structured, declarative rule definitions.
- **Concrete Deliverable**:
  - YAML/JSON rule schema definition in `backend/app/rules/schemas.py`.
  - Rule files in `backend/app/rules/definitions/` covering GTFOBins, SUID backdoor creation, and shadow access.
  - Dynamic rule loader in `service.py`.
- **Acceptance Criteria**:
  - Adding a new detection pattern requires only dropping a YAML rule file without modifying Python source code.
  - All existing 7 sample scenario findings continue to trigger with identical confidence and severity.
- **Tests or Verification**:
  - Rule validation test verifying all YAML definitions adhere to the Pydantic rule schema.

---

### Day 14: Labeled Benchmark Evaluation Dataset & Precision/Recall Metrics
- **Goal**: Create an automated detection evaluation benchmark to measure detection accuracy and false positive rates.
- **Concrete Deliverable**:
  - Benchmark evaluation script `scripts/evaluate_detection_engine.py`.
  - Golden evaluation corpus in `sample-data/benchmark/` containing 10 attack traces and 25 benign administrative traces.
- **Acceptance Criteria**:
  - Benchmark computes Precision, Recall, and F1-score across all detection categories.
  - Current rule set achieves $\ge 90\%$ Recall and $\le 5\%$ False Positive Rate against the benchmark corpus.
- **Tests or Verification**:
  - Run `python scripts/evaluate_detection_engine.py` and output verifiable metric table.

---

## Phase 3: Responsible AI-Assisted Investigation and Usability (Days 15–21)

### Day 15: Opt-In LLM Provider Interface & Safe Architecture
- **Goal**: Implement an optional, pluggable LLM provider interface that remains 100% disabled by default.
- **Concrete Deliverable**:
  - Abstract base provider `backend/app/services/ai/base.py` and Mock provider `MockAIProvider`.
  - Configuration toggle `ENABLE_AI_ASSISTANCE=False` in `config.py`.
- **Acceptance Criteria**:
  - Zero external network requests occur when `ENABLE_AI_ASSISTANCE` is `False`.
  - All application features (intake, timeline, investigation, reporting) operate at 100% functionality without an LLM.
- **Tests or Verification**:
  - Unit tests verifying mock provider output and asserting that missing API keys do not cause runtime errors.

---

### Day 16: PII & Credential Pre-Flight Sanitization Engine
- **Goal**: Build a privacy scrubbing filter to remove sensitive tokens, passwords, and private identifiers before LLM processing.
- **Concrete Deliverable**:
  - Sanitizer module `backend/app/services/ai/sanitizer.py`.
  - Regex masks replacing IPv4 addresses, SSH private keys, password hashes, and email addresses with synthetic placeholders (`[REDACTED_IP_1]`).
- **Acceptance Criteria**:
  - Ingested log messages containing credentials or raw keys are sanitized before being passed into prompt templates.
  - Sanitization reversible map is maintained locally to re-insert identifiers into final reports if approved.
- **Tests or Verification**:
  - Unit tests in `backend/tests/unit/test_sanitizer.py` asserting 100% scrubbing of sample private keys and credentials.

---

### Day 17: Bounded Executive Summary Drafting
- **Goal**: Enable the LLM to draft a human-readable incident executive summary grounded strictly in confirmed findings.
- **Concrete Deliverable**:
  - Prompt orchestrator `backend/app/services/ai/summarizer.py` utilizing strict JSON schema enforcement.
  - Endpoint `POST /api/v1/investigation/{case_id}/draft-summary`.
- **Acceptance Criteria**:
  - Prompt sends only confirmed finding titles, categories, and severity—never raw, unvetted log dumps.
  - Output is strictly validated against `ExecutiveSummaryDraft` Pydantic schema.
  - Hallucinated findings not present in the input prompt are rejected by validator.
- **Tests or Verification**:
  - Unit tests validating Pydantic schema validation and prompt structure.

---

### Day 18: Remediation & MITRE ATT&CK Runbook Suggestions
- **Goal**: Provide automated, actionable remediation runbooks mapped to detected MITRE techniques.
- **Concrete Deliverable**:
  - Offline MITRE ATT&CK remediation catalog in `backend/app/data/mitre_remediations.json`.
  - Frontend component `RemediationPlan.tsx` displaying step-by-step containment instructions.
- **Acceptance Criteria**:
  - Every detected finding displays immediate containment commands (e.g., revoking SUID permissions, disabling compromised SSH keys).
  - Remediation guidance loads instantly from local catalog without external API calls.
- **Tests or Verification**:
  - Unit tests checking catalog mapping coverage for all 7 primary attack categories.

---

### Day 19: Token Usage & Cost Control Guardrails
- **Goal**: Implement strict token budgeting and cost controls for LLM operations.
- **Concrete Deliverable**:
  - Budget manager `backend/app/services/ai/budget.py` tracking monthly and per-investigation token usage.
  - Hard limit of 1,500 prompt tokens and 500 completion tokens per investigation.
- **Acceptance Criteria**:
  - Investigations exceeding token budget abort before sending API calls.
  - UI displays current token expenditure and remaining monthly budget meter.
- **Tests or Verification**:
  - Unit tests simulating prompt overflow and verifying budget abort trigger.

---

### Day 20: Analyst LLM Feedback & Regeneration Controls
- **Goal**: Empower analysts to review, accept, edit, or reject AI-drafted summaries before inclusion in reports.
- **Concrete Deliverable**:
  - UI review widget `frontend/src/components/investigation/AISummaryReview.tsx`.
  - Explicit buttons: "Accept Draft", "Edit in Place", "Discard Draft".
- **Acceptance Criteria**:
  - AI draft is never automatically merged into official case records without explicit analyst button click.
  - Final report clearly tags executive summaries as "Analyst Edited (AI Assisted)" or "Manual".
- **Tests or Verification**:
  - Report export verification ensuring proper methodology provenance tag in HTML/PDF outputs.

---

### Day 21: Forensic Timeline Visualizer Enhancements
- **Goal**: Upgrade the timeline view with interactive filtering, attack stage badges, and zoom controls.
- **Concrete Deliverable**:
  - Timeline component upgrade in `frontend/src/components/timeline/TimelineVisualizer.tsx`.
  - Attack stage pill filters (`ALL`, `AUTH`, `EXEC`, `PRIVESC`, `PERSISTENCE`) and search input.
- **Acceptance Criteria**:
  - Instant client-side filtering across thousands of events without UI lag.
  - Suspicious events visually highlighted with cyber-defense warning badges.
- **Tests or Verification**:
  - Manual test filtering the 30-event sample scenario by `PRIVILEGE_ESCALATION` stage.

---

## Phase 4: Test Automation, Deployment Hardening, Documentation & Portfolio Delivery (Days 22–30)

### Day 22: GitHub Actions Automated CI Pipeline
- **Goal**: Create automated CI workflows validating code quality, tests, and builds on every pull request.
- **Concrete Deliverable**:
  - `.github/workflows/ci.yml` matrix testing Python 3.11, 3.12 and Node 18, 20.
  - Workflow steps executing: `pytest`, `verify_reports.mjs`, `tsc`, and `vite build`.
- **Acceptance Criteria**:
  - CI fails immediately if any backend test fails, type errors occur, or frontend build breaks.
  - Pull requests require green CI badge before merging.
- **Tests or Verification**:
  - Run GitHub Action locally via `act` or push branch to verify workflow execution.

---

### Day 23: Multi-Stage Production Dockerization
- **Goal**: Create hardened, minimal Docker container images for both backend and frontend.
- **Concrete Deliverable**:
  - `backend/Dockerfile` (multi-stage Python Alpine/Distroless image running as non-root user `appuser`).
  - `frontend/Dockerfile` (multi-stage build outputting static assets to unprivileged Nginx).
  - `docker-compose.yml` orchestrating local containerized stack.
- **Acceptance Criteria**:
  - Containers run without root privileges.
  - Images contain zero dev dependencies, compilers, or secrets.
  - Stack boots via `docker compose up` and passes health check.
- **Tests or Verification**:
  - Execute `docker compose config` and test local build `docker build -t test-backend backend/`.

---

### Day 24: Security Header & Reverse Proxy Configuration
- **Goal**: Harden HTTP response headers and configure secure Nginx reverse proxy.
- **Concrete Deliverable**:
  - `deploy/nginx.conf` with security headers: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.
  - FastAPI middleware adding standard security headers to all responses.
- **Acceptance Criteria**:
  - Security headers present on all HTTP responses.
  - Security header analysis (e.g., via `securityheaders.com` standards) rates configuration 'A'.
- **Tests or Verification**:
  - Automated test in `backend/tests/unit/test_security_headers.py` checking response headers.

---

### Day 25: Automated End-to-End Testing with Playwright
- **Goal**: Implement headless browser end-to-end tests validating the complete user journey.
- **Concrete Deliverable**:
  - Playwright test suite `frontend/e2e/investigation.spec.ts`.
  - Tests executing: Login ➔ Ingest Sample ➔ Run Investigation ➔ Confirm Finding ➔ Save Case ➔ Export HTML Report.
- **Acceptance Criteria**:
  - E2E tests execute headlessly and pass without timing out or UI errors.
  - Downloaded HTML report is verified to contain sanitized content and correct case ID.
- **Tests or Verification**:
  - Run `npx playwright test` inside `frontend/`.

---

### Day 26: Application Observability, Structured Logging & Health Metrics
- **Goal**: Implement production structured JSON logging and Prometheus metric endpoints.
- **Concrete Deliverable**:
  - Structured logging configuration in `backend/app/core/logging.py` outputting JSON lines with timestamps and correlation IDs.
  - `/metrics` endpoint exposing request latencies, finding counts, and ingestion error counters.
- **Acceptance Criteria**:
  - Logs are machine-readable JSON format without unescaped stack traces.
  - Prometheus scrape endpoint responds with standard format metrics.
- **Tests or Verification**:
  - Unit tests verifying `/metrics` response structure and JSON log format.

---

### Day 27: Data Retention & Cryptographic Case Erasure
- **Goal**: Implement configurable data retention policies and secure deletion routines.
- **Concrete Deliverable**:
  - Retention cleanup worker `backend/app/services/maintenance/retention.py`.
  - Endpoint `POST /api/v1/cases/{case_id}/purge` executing multi-pass overwrite and database deletion.
- **Acceptance Criteria**:
  - Cases older than configurable retention threshold (e.g., 90 days) can be automatically archived or purged.
  - Deletion completely removes associated raw log files and database records.
- **Tests or Verification**:
  - Integration test verifying deletion of a mock case and removal of disk artifacts.

---

### Day 28: Interactive Forensic Scenario Pack
- **Goal**: Expand the sample library with three realistic Linux attack scenarios.
- **Concrete Deliverable**:
  - `sample-data/linux/scenario-ransomware-staging.log` (payload staging + encryptor execution).
  - `sample-data/linux/scenario-webshell-backdoor.log` (Apache/Nginx spawned bash shell + discovery).
  - `sample-data/linux/scenario-cron-persistence.log` (malicious crontab + curl callback).
- **Acceptance Criteria**:
  - All scenarios loadable via the UI sample scenario picker.
  - Investigation engine reliably detects the attack patterns with high confidence.
- **Tests or Verification**:
  - Automated tests validating successful detection across all three new scenarios.

---

### Day 29: Complete Technical Documentation & Architecture Diagrams
- **Goal**: Produce publication-grade technical documentation, OpenAPI specifications, and architecture diagrams.
- **Concrete Deliverable**:
  - Interactive Mermaid architecture diagrams in `docs/ARCHITECTURE.md`.
  - Comprehensive API specification export `docs/openapi.json`.
  - Contributor guide `CONTRIBUTING.md` detailing local setup, test execution, and coding standards.
- **Acceptance Criteria**:
  - All documentation accurately reflects the implemented state of the repository.
  - Zero broken links or undocumented endpoints.
- **Tests or Verification**:
  - Markdown linting and documentation link verification script.

---

### Day 30: Portfolio Showcase, Demo Recording & Public v1.0 Release
- **Goal**: Polish the repository for public presentation, create release artifacts, and publish v1.0.0.
- **Concrete Deliverable**:
  - Curated project demo script `docs/DEMO-SCRIPT.md`.
  - Polished root `README.md` showcasing architecture diagrams, screenshots, test badges, and live demo link.
  - Git tag `v1.0.0` and GitHub Release notes summarizing the complete 30-day journey.
- **Acceptance Criteria**:
  - Clean local repository with 100% test pass rate across backend, frontend, and E2E suites.
  - Professional, recruiter-ready portfolio presentation highlighting security-first engineering decisions.
- **Tests or Verification**:
  - Final execution of complete test suite:
    - `python -m pytest` (All backend tests pass)
    - `node scripts/verify_reports.mjs` (All report tests pass)
    - `npm run build` (Clean frontend build)
    - `docker compose up --build` (Clean container launch)
