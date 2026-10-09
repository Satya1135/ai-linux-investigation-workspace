# Day 6 — Milestone 2: Investigation Analysis Interface

## 1. Overview & Objectives

Milestone 2 delivers a functional, forensic-grade **Investigation Analysis Interface** connected directly to the deterministic backend investigation pipeline implemented in Milestone 1.

The interface allows security analysts to evaluate Linux security telemetry, visualize correlated multi-stage attack progressions, examine structured findings with grounded confidence scores and actionable next steps, verify evidence provenance down to source line references, and review execution traces across all 5 pipeline activities.

---

## 2. Navigation & Page Entry Points

### 1. Primary Tactical Navigation (Sidebar)
- **Menu Item**: `AI Analysis` (ID: `cases`, Route: `/cases`)
- **Status**: Enabled (`Live`)
- **Visual Icon**: `Cpu` (tactical processor icon)
- **Direct Navigation**: Clicking `AI Analysis` in the sidebar immediately presents the Investigation Analysis page.

### 2. Cross-Page Workflow Navigation
- **From Investigation Timeline (`/investigation`)**:
  - When timeline events are loaded, the header bar features an **`ANALYZE FINDINGS ({N} EVT)`** primary action.
  - Clicking this button carries the current timeline events into the Investigation Analysis page and unlocks the **`ANALYZE CURRENT TIMELINE`** workflow.
- **From Operations Dashboard (`/dashboard`)**:
  - The **`INVESTIGATION ANALYSIS`** metric card displays `LOCAL RULES // Deterministic Heuristics (Day 6)`.
  - Clicking the card opens the Investigation Analysis interface directly.
- **From Evidence Intake (`/evidence`)**:
  - Ingesting logs or loading a sample transitions to the Timeline, which then provides 1-click progression to Investigation Analysis.

---

## 3. Difference: Local Rule-Based Analysis vs. Hosted AI Models

| Dimension | Local Rule-Based Analysis (Current Engine) | Hosted LLM / Cloud AI Model |
|---|---|---|
| **Privacy & Sovereignty** | 100% on-premise/local. Zero telemetry leaves the workspace. | Sends confidential server logs to external third-party cloud APIs. |
| **Deterministic Consistency** | Identical inputs always generate identical findings, confidence scores, and verdicts. | Non-deterministic; temperature fluctuations can yield inconsistent results. |
| **Truthfulness & Provenance** | Findings are mathematically grounded in matched event IDs and line numbers. Hallucination impossible. | Risk of hallucinating non-existent IPs, timestamps, commands, or attack stages. |
| **Cost & Dependencies** | 100% Free. Zero paid API keys (no Anthropic, OpenAI, or Gemini accounts needed). | Incurs per-token API charges and requires external network connectivity. |
| **Labelling Integrity** | Honestly labelled as **`LOCAL RULE-BASED ANALYSIS`** (`analysis_method: "rule_based"`). | Marketed as generative AI / LLM reasoning. |

---

## 4. API Endpoints Used

### 1. `POST /api/v1/investigation/sample`
Executes the defensive pipeline against the pre-packaged privilege escalation scenario (`sample-privilege-escalation.log`).

- **Request**:
  ```json
  { "sample_name": "sample-privilege-escalation.log" }
  ```
- **Response**: Returns `InvestigationResponse` with `SUSPICIOUS_ACTIVITY_DETECTED` verdict, 6 high-confidence findings, 5 activity traces, and 0 low-confidence noise.

### 2. `POST /api/v1/investigation/analyze`
Executes the defensive pipeline on arbitrary chronologically sequenced `TimelineEvent` objects.

- **Request**:
  ```json
  {
    "events": [
      {
        "event_id": "timeline-evt-001",
        "timestamp": "Oct 06 08:35:10",
        "host": "srv-corp-lnx01",
        "process": "sshd",
        "event_type": "AUTH_FAIL",
        "raw_message": "...",
        "original_event_index": 4,
        "source_line_start": 4,
        "source_line_end": 4,
        "suspicious": true,
        "severity": "LOW",
        "attack_stage": "AUTHENTICATION"
      }
    ]
  }
  ```
- **Response**: Returns `InvestigationResponse` with computed verdict, findings, noise counts, and pipeline activities.

---

## 5. Interface Features & State Handling

### 1. Loading State & Duplicate Submission Prevention
- While a request is in flight, all analysis trigger buttons are disabled (`disabled={isLoading}`).
- Displays a dedicated tactical spinner card with descriptive message detailing the active pipeline stages.

### 2. Error Handling & Retry Option
- Displays a prominent error alert banner with `AlertTriangle` icon and client-safe error message.
- Includes a 1-click **`RETRY`** button that re-triggers the exact failed operation (sample or timeline).
- Includes a dismiss action (`✕`).

### 3. Empty State (Before Analysis Runs)
- When no investigation has run, presents a tactical empty-state hero card explaining the scope of multi-stage correlation.
- Offers two primary quick-action pathways:
  1. `RUN SAMPLE INVESTIGATION (30 EVENTS)`
  2. `ANALYZE CURRENT TIMELINE` (if timeline events are loaded) or `OPEN INVESTIGATION TIMELINE`.

### 4. Verdict Card & Crucial Safety Boundary
- Supports all three verdicts with contextual visual themes:
  - `SUSPICIOUS_ACTIVITY_DETECTED`: Crimson/Rose border and glowing alert badge.
  - `NO_HIGH_CONFIDENCE_FINDINGS`: Amber border with explicit security note:
    > **SECURITY NOTE**: Absence of high-confidence findings indicates no matching heuristic indicators were detected. It does not constitute definitive proof of system security.
  - `INSUFFICIENT_EVIDENCE`: Muted Cyan border with volume advisory.

### 5. Activity Execution Trace (5 / 5 Stages)
Renders the real chronological activity events returned by the backend:
1. `VALIDATION` (payload structure and evidence line verification)
2. `CORRELATION` (entity clustering by host, process, and attack stage)
3. `SEQUENCE_ANALYSIS` (multi-stage attack pattern detection)
4. `CONFIDENCE_ASSESSMENT` (confidence scoring and noise suppression)
5. `RESULT_PREPARATION` (verdict assignment and deduplication)

### 6. Findings Cards & Provenance Drawer
- Displays findings sorted by severity (`CRITICAL` &rarr; `HIGH` &rarr; `MEDIUM` &rarr; `LOW`).
- Each card details:
  - Stable finding ID (`FND-001`) and SOC category badge
  - Descriptive title
  - Confidence percentage pill (e.g. `95%`)
  - Grounded factual explanation
  - Distinct **Recommended Next Investigation Step** callout box
  - Interactive evidence reference pills (e.g. `timeline-evt-004 #4`)
  - Hosts, processes, and observed time range
- Clicking an evidence reference pill opens an in-page forensic inspection modal displaying the verbatim log line, line number, timestamp, and host. If source line context is not in local memory, it displays an honest message and offers to navigate to the Investigation Timeline.

---

## 6. Verification Commands & Actual Results

### Backend Pytest Suite
Run from repository root in PowerShell:
```powershell
.venv\Scripts\pytest -q
```
**Actual Result**:
```
...............................................................          [100%]
63 passed, 1 warning in 0.73s
```
- **Total Tests Passing**: **63 passed** (45 Day 4 & Day 5 regression tests + 18 Day 6 investigation unit and integration tests).

### Frontend Production Build
Run from `frontend/` directory:
```powershell
cd frontend
npm run build
```
**Actual Result**:
```
> ai-linux-investigation-workspace-frontend@0.1.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1544 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.99 kB │ gzip:  0.53 kB
dist/assets/index-DXfU8e1E.css   74.40 kB │ gzip: 12.31 kB
dist/assets/index-DLZYRB3_.js   280.90 kB │ gzip: 82.12 kB
✓ built in 24.19s
```
- **Result**: 0 TypeScript compilation errors, production bundle successfully compiled.

---

## 7. How to Run Locally

1. **Start Backend**:
   ```powershell
   .venv\Scripts\uvicorn backend.app.main:app --reload --port 8000
   ```
2. **Start Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173` in a browser.
4. Click **`AI Analysis`** in the sidebar.
5. Click **`ANALYZE SAMPLE SCENARIO`** to run the defensive investigation pipeline.
6. Observe the verdict, KPI summary, 5 activity execution steps, and 6 high-confidence findings with interactive evidence references.
