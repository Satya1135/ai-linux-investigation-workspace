# Day 8 — Final Report & PDF Export

## Overview

Day 8 introduces comprehensive forensic reporting and export capabilities to the AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace. Analysts can generate formal incident documentation for any currently active investigation or previously saved case record in their browser session.

Reports can be exported in two formats without paid external services or heavy binary dependencies:
1. **Standalone HTML Report:** A self-contained, sanitized `.html` file with embedded styling for offline sharing, internal documentation, or legal archiving.
2. **Browser-Native PDF Export:** Instant PDF rendering via `window.print()` using print-specific `@media print` CSS stylesheets tailored for standard A4 document layout.

---

## Report Sections

Every generated report contains eight distinct forensic sections:

1. **Header & Metadata:** Case identifier (`LIN-YYYYMMDD-XXXXX`), editable case title, generation timestamp, initial triage timestamp, total evaluated events, and analysis methodology.
2. **Investigation Verdict Banner:** Transparent display of high-level verdict (`SUSPICIOUS_ACTIVITY_DETECTED`, `NO_HIGH_CONFIDENCE_FINDINGS`, or `INSUFFICIENT_EVIDENCE`) accompanied by the rule-engine explanation.
3. **Executive Summary & Metrics:** Incident scope, total findings count, breakdown of analyst decisions (Confirmed, Rejected, Edited, Pending), and overarching case-level directives or notes.
4. **Findings & Analyst Adjudication:** Each detected finding is displayed with:
   - Severity rating (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
   - Calculated confidence percentage
   - Attack category tag
   - Original immutable rule-engine title and factual explanation
   - Analyst decision badge (`CONFIRMED`, `REJECTED`, `EDITED`, `PENDING`)
   - Analyst amended title/explanation (when edited) clearly demarcated alongside original findings
   - Finding-level analyst notes explaining the rationale for confirmation or rejection
   - Actionable recommended next investigation step
   - Corroborating evidence references with event IDs and original log line indices
5. **Investigation Timeline:** Chronological tabular view of events detailing timestamps, event IDs, hostnames, process names, attack stages, severities, original log line numbers, and raw log message snippets.
6. **Evidence Provenance:** Specific mapping between detected findings and the underlying normalized log events.
7. **Analyst Notes & Directives:** Case-level notes and specific finding annotations captured during triage.
8. **Methodology & Limitations:** Explicit statement of detection boundaries (deterministic rule engines, absence of live cloud LLM queries, and telemetry limits).

---

## Data Model & Timeline Preservation

In Day 7, cases were saved in `localStorage` under `SavedInvestigationCase`. Day 8 enhances this model with an optional `timeline?: TimelineEvent[]` property:

```typescript
export interface SavedInvestigationCase {
  caseId: string;
  caseName: string;
  createdAt: string;
  updatedAt: string;
  verdict: InvestigationVerdict;
  totalEventsAnalyzed: number;
  analysisMethod: string;
  originalAnalysis: InvestigationResponse;
  reviews: AnalystFindingReview[];
  analystNotes: string;
  timeline?: TimelineEvent[]; // Preserved chronological events for reporting
}
```

### Backward Compatibility
- **Historical Cases:** Cases created prior to Day 8 without stored timeline arrays continue to load without errors.
- **Graceful Limitation Notice:** When viewing a report for a legacy case lacking timeline telemetry, Section 3 displays an informative notice explaining that full chronological timeline data was not preserved with the legacy record, while all cited evidence IDs and line numbers remain fully visible in the findings section.

---

## Security & Sanitization

1. **Strict HTML Escaping (XSS Prevention):** All user-supplied inputs and untrusted log messages (which may contain attacker-crafted shell commands, script tags, HTML entities, or control sequences) are strictly escaped via `escapeHtml()` replacing `&`, `<`, `>`, `"`, and `'`.
2. **Safe Filenames (Path Traversal Prevention):** Downloaded HTML files use filenames sanitized to strip path separators (`/`, `\`), null bytes, traversal dots (`..`), and invalid filename characters.
3. **No Code Execution:** Reports treat all evidence strings as inert text. No `eval()`, `dangerouslySetInnerHTML`, or terminal command execution is performed.
4. **Zero Paid APIs & Privacy:** No telemetry or evidence is transmitted to third-party services. All report generation is performed client-side and offline.

---

## PDF Export Architecture

Rather than relying on server-side binary libraries such as `WeasyPrint` (which require native OS C-libraries like Cairo/Pango unavailable in standard browser contexts and minimal cloud containers), PDF export is handled via:
- Triggering `window.print()` on user click.
- Applying `@media print` CSS rules in `ReportView.module.css`:
  - Hides UI headers, sidebar navigation, action toolbars, and case pickers.
  - Switches to a high-contrast white background with dark slate typography.
  - Applies `break-inside: avoid;` to finding cards and tables to prevent awkward pagination splits.
  - Sets standard `@page { size: A4 portrait; margin: 12mm; }`.

---

## Verification & Test Commands

### 1. Automated Report Verification (13 Tests)
Runs comprehensive validation of data formatting, chronological ordering, decision mapping, XSS escaping, filename sanitization, and backward compatibility:
```powershell
node scripts/verify_reports.mjs
```

### 2. Backend Pytest Suite (68 Tests)
Runs full backend test suite including evidence ingestion, timeline analysis, investigation heuristics, and report data integrity:
```powershell
.\.venv\Scripts\python -m pytest
```

### 3. Frontend Production Build
Verifies TypeScript compilation and production bundling:
```powershell
cd frontend
npm run build
```

---

## Manual Verification Steps

1. **Launch Local Application:**
   - In terminal 1: `.\.venv\Scripts\python -m uvicorn backend.app.main:app --reload --port 8000`
   - In terminal 2: `cd frontend && npm run dev`
2. **Run Analysis & Review:**
   - Navigate to **AI Analysis** in the sidebar.
   - Click **ANALYZE SAMPLE SCENARIO** (loads 30 events).
   - In Finding #1, click **CONFIRM FINDING** and add note: `"Confirmed malicious find GTFOBins execution."`
   - In Finding #2, click **REJECT FINDING** and add note: `"False positive: authorized maintenance task."`
   - Click **SAVE CASE**.
3. **Generate Report Directly from Analysis:**
   - Click the **VIEW REPORT** button in the analysis toolbar or case review header.
   - Verify all 8 report sections are populated with case metadata, executive summary KPIs (1 confirmed, 1 rejected), findings, and chronological timeline.
4. **Generate Report from Case Management:**
   - Navigate to **Saved Cases** in the sidebar.
   - On the saved case card, click **View report**.
   - Verify the report view opens with the selected case.
5. **Test Standalone HTML Export:**
   - Click **Download HTML Report**.
   - Open the downloaded `.html` file in a browser; verify all sections render with self-contained styles.
6. **Test PDF Export:**
   - Click **Export PDF / Print Report**.
   - Verify the print preview dialog opens with navigation and action bars hidden and clean A4 pagination.
   - Save as PDF or cancel without UI disruption.
