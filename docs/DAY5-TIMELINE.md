# Day 5 — Investigation Timeline (Milestone 1 & Milestone 2)

## 1. Objective

Build a real **Investigation Timeline** for the AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace. The timeline ingests normalized candidate events from Linux security logs (such as `syslog`, `auth.log`, and `auditd`), sequences them chronologically, deterministically identifies suspicious anomalies, maps events to MITRE-aligned attack stages, provides deep bidirectional traceability back to the original raw evidence, and delivers forensic usability controls including combined multi-criteria filtering, active filter indicators, resilient selection synchronization, and dedicated empty states.

---

## 2. Implemented Features

### Milestone 1: Timeline Foundation
1. **Chronological Event Sequencing**:
   - Automated timestamp extraction and sorting ensuring strict chronological progression across syslog and ISO formatted time formats.
   - Preserves index stability and original evidence line relationships.

2. **Deterministic Attack Stage Classification**:
   - Controlled vocabulary of attack progression stages:
     - `AUTHENTICATION` (e.g. SSH brute force attempts, session opening/closing)
     - `RECONNAISSANCE` / `PRIVILEGE_DISCOVERY` (e.g. `sudo -l`, `id`, `whoami`, permission queries)
     - `PRIVILEGE_ESCALATION` (e.g. `auditd` EUID 0 transitions, `find -exec /bin/sh` GTFOBins, SUID root shells)
     - `EXECUTION` (e.g. `curl` payload staging, `chmod +x` binary permissions, root shell spawns)
     - `PERSISTENCE` (e.g. automated `cron` tasks invoking payloads in `/tmp`)
     - `POST_EXPLOITATION` (e.g. unauthorized read access to `/etc/shadow`)
     - `OTHER` (e.g. routine `systemd` daemon tasks)

3. **Suspicious Event Flagging & Severity Assignment**:
   - Real-time heuristic evaluation assigning severity levels (`INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
   - Generates factual, concise `highlight_reason` strings explaining why specific security anomalies are flagged.

4. **Forensic Evidence Traceability**:
   - Unbroken provenance: `Timeline Event (evt-00X)` &rarr; `Normalized Event (#X)` &rarr; `Source Evidence (Line #X)`.
   - Displays verbatim original plain text without HTML evaluation or code execution.

5. **Three-Column Forensic Cockpit Layout**:
   - **Left Rail**: Interactive Attack Stage Rail displaying detected stage counts and quick filtering.
   - **Center Stream**: Chronological events stream with timeline nodes, severity tags, process indicators, and search filter.
   - **Right Pane**: Selected event detail, forensic properties grid, highlight alert box, traceability breadcrumbs, and raw log line viewport.

### Milestone 2: Timeline Investigation Controls & Usability
1. **Multi-Field Keyword Search**:
   - Search across raw log messages, processes, hosts, event types, highlight reasons, original event indices, and event IDs.
   - Includes real-time matching counter (`SHOWING X OF Y EVENTS`) and dedicated clear button (`✕`).
   - Fast client-side evaluation with zero repeated API roundtrips.

2. **Interactive Attack-Stage Rail Filter**:
   - Click any detected attack stage in the left rail to instantly isolate events from that progression phase.
   - "ALL TIMELINE EVENTS" button restores full timeline visibility.
   - Clear visual indicators for detected vs. inactive attack stages.

3. **Dedicated Suspicious-Only Toggle**:
   - One-click `SUSPICIOUS ONLY` filter button in the left rail footer with dynamic active state styling.
   - Displays real-time suspicious anomaly count (e.g., 17 suspicious events in the sample scenario).

4. **Arbitrary Filter Combination**:
   - Combines Search + Attack-Stage Rail Filter + Suspicious-Only filter seamlessly (e.g., `PRIVILEGE_ESCALATION` + `SUSPICIOUS ONLY` + `"sudo"`).
   - Zero mutation of the underlying timeline or evidence records.

5. **Active Filter Bar & Clear Actions**:
   - Displays interactive filter chips for all active criteria (`STAGE: ...`, `SUSPICIOUS ONLY`, `SEARCH: "..."`).
   - Each chip includes a 1-click removal button (`✕`).
   - Prominent `RESET FILTERS` / `RESET ALL FILTERS` action restores all default states.

6. **Resilient Event Selection Synchronization**:
   - Preserves analyst's selected event across filtering operations whenever visible.
   - Automatically synchronizes to the first visible event when previous selection is filtered out.
   - Prevents stale or mismatched details from being shown in the detail pane.

7. **Dedicated Forensic Empty States**:
   - Professional empty state card when filter criteria produce 0 matches, displaying active parameters and a `RESET ALL FILTERS` button.
### Milestone 3: Final Verification & Security Audit
1. **End-to-End Workflow Verification**:
   - Verified seamless flow: `Raw Logs / Sample Scenario` &rarr; `Evidence Intake Normalization` &rarr; `Investigation Timeline` &rarr; `Attack Stage Mapping` &rarr; `Multi-Criteria Filtering` &rarr; `Suspicious Anomaly Highlighting` &rarr; `Event Detail Inspection` &rarr; `Evidence Provenance Traceability`.
2. **Security & Boundary Enforcement**:
   - Zero command execution, zero `eval`/`exec`/`os.system`/`subprocess`.
   - Zero `dangerouslySetInnerHTML` in React components.
   - Zero external AI or paid API dependencies (100% free and local deterministic heuristics).
3. **Comprehensive Regression Testing**:
   - 45/45 backend pytest tests passing.
   - Frontend production build succeeds with 0 errors.

---

## 3. Detection Method & Free-Only Rule

- **Local Deterministic Rules**: Attack stage classification and anomaly detection operate entirely via transparent, local Python rule engines in `backend/app/services/timeline/service.py`.
- **Zero Paid Dependencies**: Does **NOT** call the Anthropic API, external threat intelligence platforms, or paid SaaS services.
- **Classification Method Flag**: All responses explicitly include `"classification_method": "rule_based"` to ensure analytical transparency for SOC analysts.

---

## 4. Security Boundaries

- **Untrusted Text Data**: All logs, syslog messages, and audit lines are strictly handled as inert text strings.
- **No Command Execution**: Zero use of `eval()`, `exec()`, `os.system()`, `subprocess`, or `shell=True`. Commands embedded in log messages (e.g. `curl`, `chmod`, `rm`, `/bin/sh`) are never executed.
- **Input Validation**: Strict Pydantic v2 schemas reject malformed or empty requests with descriptive error codes.

---

## 5. API Endpoints

- **`POST /api/v1/timeline/analyze`**: Accepts a list of `LogEventCandidate` objects and returns the analyzed `TimelineResponse`.
- **`POST /api/v1/timeline/sample`**: Loads the pre-packaged sample scenario from `sample-data/linux/` and returns the reconstructed timeline.

---

## 6. Verification Results

### Backend Pytest Suite
```bash
.venv\Scripts\pytest -q
# Result: 45 passed (31 Day 4 tests + 14 Day 5 unit and integration tests) in 0.57s
```

### Frontend Production Build
```bash
cd frontend && npm run build
# Result: 0 TypeScript errors, 0 lint errors, build completed in 8.72s
```

### Sample Scenario Verification
- **Sample File**: `sample-data/linux/sample-privilege-escalation.log`
- **Total Events**: `30`
- **Suspicious Events Detected**: `17`
- **Stages Detected**: `AUTHENTICATION`, `PRIVILEGE_DISCOVERY`, `PRIVILEGE_ESCALATION`, `EXECUTION`, `PERSISTENCE`, `POST_EXPLOITATION`, `OTHER`

---

## 7. Day 5 Status

**Day 5 is COMPLETE.** All requirements for Milestones 1, 2, and 3 are implemented, tested, and verified.


