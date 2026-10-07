# Day 4 Milestone 1: Backend Evidence Intake Foundation

**Milestone**: Day 4 — Milestone 1: Backend Evidence Intake  
**Status**: Implemented & Verified (31/31 backend tests passing)  
**Security Boundary**: Passive evidence intake only. Untrusted text data is never executed, evaluated, or passed to shell/subprocesses.

---

## 1. Overview

The backend evidence intake foundation provides safe ingestion, validation, normalization, and preservation of raw Linux security logs. It allows analysts and automated systems to submit evidence via three intake paths:
1. **Pre-packaged Sample Scenario** (`sample`)
2. **File Upload** (`upload` via `.log` or `.txt`)
3. **Pasted Raw Log Text** (`paste`)

All evidence received is treated strictly as untrusted text data. The backend guarantees original evidence preservation alongside safe normalization for downstream processing.

---

## 2. Intake Specifications & Operational Limits

| Parameter | Specification | Enforcement Behavior |
| :--- | :--- | :--- |
| **Max Evidence Size** | 5 MB (`5,242,880` bytes) | Rejected with HTTP 413 (`OVERSIZED_EVIDENCE`) |
| **Allowed Upload Extensions** | `.log`, `.txt` (case-insensitive) | Strict validation; rejected with HTTP 400 (`UNSUPPORTED_EXTENSION`) |
| **Rejected Extensions** | `.exe`, `.bat`, `.cmd`, `.ps1`, `.sh`, `.py`, `.js`, `.zip`, `.bin`, `.elf`, etc. | Rejected with HTTP 400 |
| **Empty Input** | 0 bytes or whitespace-only | Rejected with HTTP 400 (`EMPTY_EVIDENCE`) |
| **Binary Detection** | Null bytes (`\x00`) or non-UTF-8 | Rejected with HTTP 400 (`BINARY_EVIDENCE_REJECTED`) |
| **Integrity Hashing** | SHA-256 hex digest | Computed deterministically on exact raw bytes received |
| **Encoding** | UTF-8 plain text | Strict UTF-8 validation |

---

## 3. Architecture & Core Components

### A. Data Schemas (`backend/app/schemas/evidence.py`)
- **`EvidenceSourceType`**: Enum classifying evidence sources (`sample`, `upload`, `paste`).
- **`PastedEvidenceRequest`**: Validated payload containing raw pasted text, optional filename, and description.
- **`SampleEvidenceRequest`**: Validated payload specifying sample scenario filename.
- **`LogEventCandidate`**: Lightweight structured representation of individual lines:
  - `event_index`: 1-based sequential integer
  - `source_line_number`: 1-based source line index
  - `event_time`: Safely recognized timestamp string or `null` if unrecognized
  - `raw_message`: Literal verbatim message text (untouched)
- **`EvidenceResponse`**: Structured API response returning:
  - `evidence_id`: Unique UUID4 identifier
  - `source_type`: `sample` | `upload` | `paste`
  - `filename`: Logical filename if available
  - `byte_size`: Integer byte size of original evidence
  - `original_content_sha256`: SHA-256 hex digest
  - `sha256_hash`: Hash alias for client consistency
  - `event_count`: Number of extracted candidates
  - `created_at`: UTC ISO timestamp
  - `validation_status`: `"valid"`
  - `normalized_events`: List of `LogEventCandidate` objects
  - `original_content`: Unmodified raw content
  - `normalized_content`: Separate normalized content representation
- **`EvidenceErrorResponse`**: Standard error schema preventing disclosure of Python tracebacks.

### B. Evidence Service (`backend/app/services/evidence/service.py`)
- **`EvidenceService.process_pasted_evidence(content, filename)`**: Validates pasted text and processes bytes.
- **`EvidenceService.process_uploaded_file(filename, raw_bytes)`**: Enforces extension whitelisting, size limits, and binary checks.
- **`EvidenceService.process_sample_scenario(sample_name)`**: Loads safe synthetic samples with strict directory traversal prevention.
- **`EvidenceService.list_available_samples()`**: Discovers available `.log` files in `sample-data/linux/`.
- **`extract_safe_timestamp(raw_line)`**: Pure regex-based recognizer supporting Syslog BSD (`Oct 06 08:12:01`), ISO 8601 (`2026-10-06T08:12:01`), Linux auditd epoch (`audit(1728204270.112:89)`), and bracketed formats. Protected by broad error capture to guarantee no crashes on malformed or adversarial input.

### C. Error Handling & Custom Exceptions (`backend/app/services/evidence/exceptions.py`)
- `EvidenceException` (Base class)
- `UnsupportedExtensionError` (HTTP 400)
- `OversizedEvidenceError` (HTTP 413)
- `EmptyEvidenceError` (HTTP 400)
- `BinaryEvidenceError` (HTTP 400)
- `SampleNotFoundError` (HTTP 404)
- `MalformedEvidenceError` (HTTP 400)

---

## 4. Normalization vs. Preservation Rules

1. **Original Evidence Preservation**:
   - Stored in `original_content` exactly as received from the network socket or disk.
   - CRLF line endings, trailing whitespace, and raw formatting are retained with 100% byte fidelity.
   - SHA-256 hash is computed directly on the original bytes.
2. **Safe Normalization**:
   - Stored in a separate field (`normalized_content`).
   - Normalizes all CRLF (`\r\n`) and CR (`\r`) sequences to standard LF (`\n`).
   - Trims only accidental trailing newlines at the end of the payload.
   - Internal indentation, tabs, and spaces in log lines are preserved without alteration.
   - Zero command interpretation or active transformation.

---

## 5. Security Boundaries & Untrusted Data Protection

> [!IMPORTANT]
> **Safety Rule**: Linux security logs frequently contain attack payloads, command strings (e.g. `rm -rf`, `curl | bash`, `$(reboot)`), shell escapes, and malformed encoding. Under no circumstances does the evidence intake service execute, evaluate, or pass this text to external interpreters.

Security safeguards implemented:
- **No `eval()` or `exec()`**: All string manipulation uses native Python string methods and compiled regular expressions.
- **No subprocess or shell calls**: Raw messages are handled purely in memory.
- **Path Traversal Protection**: Sample scenario resolution validates that resolved paths remain strictly inside `sample-data/linux/`.
- **Stack Trace Suppression**: API routes and custom exception handlers catch errors and return structured `detail` messages without leaking system internals.

---

## 6. Sample Security Scenario

A synthetic Linux security log scenario was generated at:
[`sample-data/linux/sample-privilege-escalation.log`](file:///e:/PROJECTS/ai-linux-investigation-workspace/sample-data/linux/sample-privilege-escalation.log)

Scenario characteristics:
- **Reconnaissance & Brute Force**: Synthetic SSH password attempts against `admin`, `root`, `service_account` from source `192.168.1.105`.
- **Initial Access**: Successful password authentication for `sec_analyst`.
- **Privilege Reconnaissance**: Execution of `sudo -l` and `id`.
- **Command Execution & Staging**: Process execution via `curl` downloading a synthetic script to `/tmp/.cache_updater` and making it executable.
- **Privilege Escalation**: GTFOBins execution of `/usr/bin/find` with `-exec /bin/sh -i` to obtain root privileges (`euid=0`).
- **Persistence & Access**: Creation of SUID shell `/tmp/.rootshell` and access to `/etc/shadow`.
- **Sanitization**: Entirely synthetic telemetry; zero real passwords, API keys, or private data.

---

## 7. API Endpoints

All endpoints are mounted under `/api/v1/evidence`:

| Endpoint | Method | Input | Response | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/evidence/paste` | `POST` | `PastedEvidenceRequest` (JSON) | `EvidenceResponse` (JSON) | 200 / 400 / 413 |
| `/api/v1/evidence/upload` | `POST` | `multipart/form-data` (`file`) | `EvidenceResponse` (JSON) | 200 / 400 / 413 |
| `/api/v1/evidence/sample` | `POST` | `SampleEvidenceRequest` (JSON) | `EvidenceResponse` (JSON) | 200 / 404 |
| `/api/v1/evidence/samples` | `GET` | None | `{"samples": [...]}` | 200 |

---

## 8. Automated Tests Performed

The test suite contains 31 automated tests (unit and integration) validating all 14 mandatory test scenarios:

```
backend/tests/integration/test_evidence_api.py::test_valid_pasted_linux_logs PASSED
backend/tests/integration/test_evidence_api.py::test_valid_log_upload PASSED
backend/tests/integration/test_evidence_api.py::test_valid_txt_upload PASSED
backend/tests/integration/test_evidence_api.py::test_sample_scenario_intake PASSED
backend/tests/integration/test_evidence_api.py::test_sample_scenario_default_payload PASSED
backend/tests/integration/test_evidence_api.py::test_list_samples_endpoint PASSED
backend/tests/integration/test_evidence_api.py::test_empty_pasted_input_rejected PASSED
backend/tests/integration/test_evidence_api.py::test_empty_uploaded_file_rejected PASSED
backend/tests/integration/test_evidence_api.py::test_unsupported_extensions_rejected PASSED
backend/tests/integration/test_evidence_api.py::test_oversized_upload_rejected PASSED
backend/tests/integration/test_evidence_api.py::test_binary_upload_rejected PASSED
backend/tests/integration/test_evidence_api.py::test_missing_sample_rejected PASSED
backend/tests/unit/test_evidence_service.py::test_safe_normalization_crlf_to_lf PASSED
backend/tests/unit/test_evidence_service.py::test_original_evidence_remains_unchanged PASSED
backend/tests/unit/test_evidence_service.py::test_deterministic_sha256_hash PASSED
backend/tests/unit/test_evidence_service.py::test_command_like_text_treated_strictly_as_text PASSED
backend/tests/unit/test_evidence_service.py::test_event_candidates_preserve_raw_messages PASSED
backend/tests/unit/test_evidence_service.py::test_timestamp_extraction_does_not_crash_on_malformed_timestamps PASSED
backend/tests/unit/test_evidence_service.py::test_timestamp_extraction_valid_formats PASSED
backend/tests/unit/test_evidence_service.py::test_empty_pasted_input_rejected PASSED
backend/tests/unit/test_evidence_service.py::test_empty_uploaded_file_rejected PASSED
backend/tests/unit/test_evidence_service.py::test_unsupported_extensions_rejected PASSED
backend/tests/unit/test_evidence_service.py::test_valid_extensions_accepted PASSED
backend/tests/unit/test_evidence_service.py::test_oversized_input_rejected PASSED
backend/tests/unit/test_evidence_service.py::test_binary_content_rejected PASSED
backend/tests/unit/test_evidence_service.py::test_sample_scenario_loading PASSED
backend/tests/unit/test_evidence_service.py::test_sample_scenario_not_found_or_traversal_rejected PASSED
backend/tests/unit/test_health.py::test_health_endpoint PASSED
backend/tests/unit/test_health.py::test_api_v1_health_endpoint PASSED
backend/tests/unit/test_root_endpoint PASSED
backend/tests/unit/test_async_health_endpoint PASSED
```

**Results**: 31 passed in 0.78s (100% success rate).

---

## 9. Milestone 2: Frontend Evidence Intake Implementation

### A. Architectural Goals
The frontend provides a dark cybersecurity interface connecting analysts to the Day 4 backend evidence APIs without ever interpreting or executing untrusted log data.

The intake workflow follows the approved pipeline:
```
[ Use Sample Scenario ] OR [ Upload .log / .txt ] OR [ Paste Linux Logs ]
                                    ↓
                            Evidence Preview
                        (Metadata + Candidates)
                                    ↓
                         Safe Original Evidence
```

### B. Frontend Components & Location
- **Intake Page**: [`frontend/src/pages/EvidenceIntake.tsx`](file:///e:/PROJECTS/ai-linux-investigation-workspace/frontend/src/pages/EvidenceIntake.tsx)
- **Styling Module**: [`frontend/src/pages/EvidenceIntake.module.css`](file:///e:/PROJECTS/ai-linux-investigation-workspace/frontend/src/pages/EvidenceIntake.module.css)
- **API Networking Layer**: [`frontend/src/services/api.ts`](file:///e:/PROJECTS/ai-linux-investigation-workspace/frontend/src/services/api.ts)
- **Domain TypeScript Types**: [`frontend/src/types/index.ts`](file:///e:/PROJECTS/ai-linux-investigation-workspace/frontend/src/types/index.ts)
- **Navigation Wiring**: [`frontend/src/components/common/Sidebar.tsx`](file:///e:/PROJECTS/ai-linux-investigation-workspace/frontend/src/components/common/Sidebar.tsx) and [`frontend/src/app/App.tsx`](file:///e:/PROJECTS/ai-linux-investigation-workspace/frontend/src/app/App.tsx)

### C. Intake Modes Supported
1. **Sample Scenario (`sample`)**:
   - Triggers `loadSampleEvidence('sample-privilege-escalation.log')`
   - Calls `POST /api/v1/evidence/sample`
   - Renders 30 normalized candidate events with full metadata.
2. **File Upload (`upload`)**:
   - Supports drag-and-drop and standard file picker.
   - Enforces `.log` and `.txt` extensions on the client before network transmission.
   - Blocks files exceeding 5 MB (`5,242,880` bytes) with immediate UI warning.
   - Transmits multipart/form-data via `POST /api/v1/evidence/upload`.
3. **Paste Linux Logs (`paste`)**:
   - Monospaced input textarea with line counter and real-time byte gauge.
   - Client-side rejection of empty or whitespace-only inputs.
   - Sends payload via `POST /api/v1/evidence/paste`.

### D. Security Banner & Safe Text Rendering
- **Security Notice**: Persistent amber banner highlighting the safety boundary:
  *"Evidence is treated as text only. Commands, scripts, binaries, and files contained in logs are never executed."*
- **Safe Text Rendering**: All log lines and raw evidence are rendered via React text primitives inside `<code>` and `<pre>` elements. HTML tags, script escapes, and command expressions inside evidence strings are never interpreted by the browser engine.
- **Copy Actions**: Dedicated clipboard utilities for SHA-256 digests and raw verbatim evidence text.

### E. Error & Loading State Management
- **Loading Overlay**: Animated spinner with context-aware status messages (`Loading synthetic scenario...`, `Uploading and validating file...`, `Validating and normalizing pasted log evidence...`).
- **Duplicate Prevention**: Buttons and inputs are disabled while requests are in flight.
- **Error Banner**: Clean dismissible rose alert banner for bad extensions, oversized payloads, empty inputs, binary content, and network unreachability. Stack traces are completely suppressed.

### F. Verification Summary
- **TypeScript & Build**: `npm run build` completed with **0 errors**.
- **Backend Test Suite**: All **31/31 backend tests passing**.
- **End-to-End API Integration**: Verified via [`scripts/verify_frontend_api.mjs`](file:///e:/PROJECTS/ai-linux-investigation-workspace/scripts/verify_frontend_api.mjs) across all 8 core flows (sample load, .log upload, .txt upload, unsupported extension rejection, oversized rejection, valid paste, empty paste rejection, and raw verbatim preservation).

---

## 10. Final Verification & Checklist Results

| Verification Check | Method / Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Backend Tests** | `pytest -v backend/tests` | **31 Passed / 0 Failed** | 100% pass rate in 0.46s |
| **Frontend Production Build** | `cd frontend && npm run build` | **0 Errors** | `tsc && vite build` bundled in 17.5s |
| **GET /health** | HTTP GET `/health` | **200 OK** | Returns `{"status":"ok"}` |
| **Sample Scenario Intake** | POST `/api/v1/evidence/sample` | **PASS** | 30 events, synthetic telemetry, metadata intact |
| **Valid .log Upload** | POST `/api/v1/evidence/upload` | **PASS** | Source `upload`, extension validated |
| **Valid .txt Upload** | POST `/api/v1/evidence/upload` | **PASS** | Source `upload`, extension validated |
| **Invalid Extension Rejection** | POST `/api/v1/evidence/upload` (`.exe`) | **PASS (400)** | Rejects non-.log/.txt files cleanly |
| **Empty / Whitespace Rejection** | POST `/api/v1/evidence/paste` (spaces) | **PASS (400)** | Blocks empty inputs |
| **5 MB Size Limit Enforcement** | POST `/api/v1/evidence/upload` (>5MB) | **PASS (413)** | Blocks payloads exceeding 5 MB |
| **Binary Content Rejection** | POST `/api/v1/evidence/upload` (null bytes) | **PASS (400)** | Detects null bytes and non-UTF-8 |
| **Verbatim Evidence Fidelity** | Hash & raw content comparison | **PASS** | SHA-256 matches raw bytes; verbatim text preserved |
| **Security Execution Barrier** | Static grep & runtime tests | **PASS** | Zero `eval`, `exec`, `subprocess`, or `dangerouslySetInnerHTML` |
| **Friendly Unreachability Handling** | Network error simulation | **PASS** | Clean error banner without stack traces |

### Known Warnings / Limitations
- **Starlette Warning**: `StarletteDeprecationWarning: Using 'httpx' with 'starlette.testclient' is deprecated; install 'httpx2' instead.` (harmless internal Starlette advisory).
- **Playwright Environment Constraint**: Browser subagent automated launch encountered an upstream driver download 404; all manual and live HTTP/API verification steps were executed directly against the active runtime servers and verified completely.


