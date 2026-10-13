# Portfolio, Presentation & Release Kit

**Project**: AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace
**Document**: Recruiter Materials, Resume Bullets, Interview Talking Points, Demo Script & Release Notes
**Classification**: Developer Portfolio / Security Workstation MVP (v1.0.0)
**Authors**: Senior Software Engineer & Technical Recruiter / Mentor (Antigravity)

---

## Deployment & Development Environment Reference

### Deployed Services (Cloud Demo)
- **Live Frontend**: [https://ai-linux-investigation-frontend.onrender.com/](https://ai-linux-investigation-frontend.onrender.com/)
- **Live Backend API**: [https://ai-linux-investigation-workspace.onrender.com/](https://ai-linux-investigation-workspace.onrender.com/)

### Local Development Environment
- **Local Frontend**: [http://localhost:5173/](http://localhost:5173/)
- **Local Backend API**: [http://127.0.0.1:8010/](http://127.0.0.1:8010/) (default fallback `http://localhost:8000/`)

### Source Control
- **GitHub Repository**: [https://github.com/Satya1135/ai-linux-investigation-workspace](https://github.com/Satya1135/ai-linux-investigation-workspace)

---

## 1. Concise Project Description (Portfolio Website / Bio)

> **AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace** is a full-stack security operations workstation built with React, TypeScript, and FastAPI. It enables security analysts to ingest untrusted Linux system logs, reconstruct chronological forensic timelines, execute deterministic rule-based threat correlation (detecting GTFOBins, SUID creation, sensitive file access, and brute-force attacks), adjudicate findings, and generate audit-ready incident reports in standalone HTML and browser-native PDF formats without external API dependencies. The detection engine operates via deterministic heuristics without invoking an LLM for finding generation; detections can produce false positives or false negatives during triage.

---

## 2. Comprehensive Project Overview (LinkedIn / GitHub Profile)

Security operations centers face a growing volume of disparate Linux telemetry, where manual log triage is slow and ungrounded AI models risk introducing analytical errors or false assumptions.

The **AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace** addresses this gap by combining an intuitive cybersecurity HUD interface with a deterministic, mathematically grounded threat correlation engine. Rather than sending untrusted system logs to third-party language models, the platform executes a 5-stage heuristic analysis pipeline locally in Python/FastAPI. It normalizes `auth.log`, `syslog`, and `auditd` streams, establishes SHA-256 evidence fingerprints supporting audit traceability, and flags privilege escalation patterns—such as GTFOBins `/usr/bin/find` execution, SUID backdoor creation, `/etc/shadow` credential harvesting, and SSH brute-force guessing. (Note: SHA-256 serves as an evidence fingerprint supporting audit traceability and change verification post-intake, but does not independently prove external origin authenticity or prevent tampering before upload.)

Every detected finding preserves direct evidence traceability back to supporting event IDs and original log line indices. The current detection pipeline uses deterministic rules and does not invoke an LLM to generate findings; detections can still produce false positives or false negatives. Analysts retain full adjudicative authority through an interactive triage workflow (Confirm, Reject, Edit, or Pend findings) backed by browser-local case persistence (`LIN-YYYYMMDD-XXXXX`). Verified cases export instantly to formal 8-section incident reports, available as sanitized, self-contained HTML files or clean A4 PDF documents rendered via browser-native CSS print stylesheets.

Backed by **71 automated Pytest tests**, **13 report verification tests**, and strict TypeScript compilation, the project demonstrates how to build resilient, privacy-first cybersecurity tooling with zero cloud service lock-in.

---

## 3. ATS-Friendly Resume Bullet Points

- **Engineered an end-to-end Linux forensic investigation workstation** using **FastAPI** and **React 18 / TypeScript**, ingesting system telemetry (`auth.log`, `syslog`, `auditd`) with SHA-256 evidence fingerprinting supporting audit traceability and millisecond chronological timeline reconstruction.
- **Developed a deterministic 5-stage threat correlation engine** in Python mapping privilege escalation, GTFOBins binary abuse, SUID persistence, and credential theft to MITRE ATT&CK techniques; uses deterministic rules without invoking an LLM for finding generation, ensuring direct evidence traceability while accounting for potential false positives or false negatives.
- **Implemented a browser-native forensic reporting architecture** featuring standalone sanitized HTML exports (XSS-protected) and `@media print` CSS PDF generation, backed by a comprehensive automated test suite of **71 Pytest backend tests** and **13 report validation tests**.

---

## 4. Technical Interview Talking Points

### A. Architectural Separation & Core Stack
- **FastAPI Backend (`backend/app/`)**: Provides asynchronous, schema-enforced REST endpoints using Pydantic v2. Clean separation of concerns across `api/v1/` routes, domain `services/` (evidence intake, timeline normalization, investigation heuristics), and `schemas/`.
- **React 18 / TypeScript Frontend (`frontend/src/`)**: Client application built with Vite and TanStack Query. Uses custom CSS Modules styled with a cybersecurity HUD design system (deep slate `#090d16`, cyan `#06b6d4`, emerald `#10b981`, and rose `#f43f5e`), avoiding bulky UI libraries while maintaining sub-second load times.

### B. Critical Engineering Pivots & Trade-Offs
- **Why Deterministic Heuristics Over Live LLM APIs**: In forensics and incident triage, reproducibility and explainability are paramount. The current detection pipeline uses deterministic rules and does not invoke an LLM to generate findings; detections cite exact line indices and event IDs, though heuristic rules can still produce false positives or false negatives. This approach eliminates live API token costs while guaranteeing reproducible rule evaluation.
- **Why Browser-Native Print-to-PDF Over WeasyPrint**: WeasyPrint requires native C-libraries (Cairo, Pango, GDK-PixBuf) that frequently cause cross-platform install failures, particularly on Windows and minimal Docker containers. By leveraging `window.print()` and `@media print` CSS rules (`break-inside: avoid;`, standard A4 margins), we achieved crisp vector PDFs with zero native binary dependencies.
- **Why Client-Side `localStorage` for Case MVP**: Allowed immediate, zero-configuration local persistence for the initial release while establishing identical TypeScript data interfaces for future PostgreSQL / Alembic migrations.

### C. Debugging & Real-World Problem Solving
- **Port 8010 & Environment Synchronization**: Resolved local port 8000 collisions by binding the backend to `http://127.0.0.1:8010` and isolating the frontend configuration via `frontend/.env.local` (`VITE_API_URL`), ensuring developer environment settings never leak into source control.
- **Path Traversal Security Defense**: When ingesting sample scenario files, standard path concatenation risked directory traversal (`../../etc/passwd`). Hardened the loader using Python's `path.is_relative_to(base_dir)` to guarantee file access cannot escape the designated sample directory.
- **Legacy Case Backward Compatibility**: When introducing chronological timeline arrays to Day 8 case models, legacy cases lacked the `timeline` field. Designed a backward-compatible parser that gracefully renders legacy reports with an informative limitation notice without crashing.

### D. Security Engineering & Hardening
- **Evidence Fingerprinting & Traceability**: Every uploaded log is assigned a SHA-256 evidence fingerprint upon intake to support audit traceability. Hashing provides an integrity baseline against post-intake file changes, though it does not independently prove external origin authenticity or prevent evidence tampering prior to upload.
- **Strict HTML Escaping & Injection Defense**: System logs frequently contain malicious payloads (e.g., `<script>`, `rm -rf /`, `DROP TABLE`). All report generation strictly escapes untrusted strings via `escapeHtml()`, treating evidence as inert plain text.
- **Safe Filename Generation**: Report downloads sanitize filenames, stripping path separators, null bytes, and traversal characters.

### E. Honest Appraisal of Current Limitations
- **Unauthenticated API Endpoints**: Endpoints currently accept requests without a Bearer token; security currently relies on localhost binding and CORS origin validation.
- **Absence of Rate Limiting**: The server does not throttle rapid upload or analysis requests.
- **Browser-Only Storage**: Saved cases reside in the local browser profile; clearing browser data clears saved cases.
- **Detection Boundaries**: Rule-based heuristics are tuned to specific patterns and can produce false positives on authorized administrative scripts or false negatives on unseen techniques.

---

## 5. Live Demo Script (60–90 Seconds)

### Scene 1: Introduction & System Health (0:00 – 0:15)
* **Action**: Open the browser to [http://localhost:5173/](http://localhost:5173/).
* **Spoken**: *"This is the AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace. You're looking at our cybersecurity HUD dashboard, which dynamically monitors local backend connectivity on port 8010 and displays active case statistics stored in browser memory."*

### Scene 2: Evidence Intake & Scenario Loading (0:15 – 0:30)
* **Action**: Click **AI Analysis** in the sidebar. Click **ANALYZE SAMPLE SCENARIO**.
* **Spoken**: *"Instead of sending sensitive logs to third-party cloud APIs, our workstation evaluates evidence locally. Here, we've loaded a multi-stage Linux privilege escalation scenario containing 30 normalized events. The backend generated a SHA-256 evidence fingerprint supporting traceability and extracted normalized timeline telemetry."*

### Scene 3: Deterministic Findings & Evidence Grounding (0:30 – 0:50)
* **Action**: Scroll through the investigation results banner showing `SUSPICIOUS_ACTIVITY_DETECTED` and the seven detected findings. Expand Finding #2 (*Privilege Escalation via Sudo Find Shell Spawn*).
* **Spoken**: *"Our deterministic rule engine detected seven distinct findings with mathematical confidence scores. Notice that each finding directly cites its supporting event IDs and exact original log line numbers—such as line 14 identifying a GTFOBins `sudo find` execution. The pipeline uses deterministic rules and does not invoke an LLM to generate findings, though detections can still yield false positives or false negatives during triage."*

### Scene 4: Analyst Adjudication & Case Management (0:50 – 1:10)
* **Action**: On Finding #1, click **CONFIRM FINDING** and add a quick note. On Finding #3, click **EDIT** to show amended text fields. Click **SAVE CASE**. Navigate to **Saved Cases** to show the saved `LIN-YYYYMMDD-XXXXX` card.
* **Spoken**: *"The analyst has full adjudicative control. We can confirm, reject, or edit any finding, record investigative notes, and save the record to our local case repository under a standardized case identifier. The original detection engine output remains immutable."*

### Scene 5: Incident Reporting & PDF Export (1:10 – 1:30)
* **Action**: Click **View report** on the saved case card. Scroll through the 8-section report. Click **Export PDF / Print Report** (briefly show the print preview dialog with clean A4 layout), then close. Click **Download HTML Report**.
* **Spoken**: *"Finally, we generate a formal 8-section incident report. We can export it as a standalone, sanitized HTML file for offline review, or export to a print-ready A4 PDF using browser-native CSS print stylesheets with custom pagination. All with zero external API fees."*

---

## 6. Screenshot & Demo-Media Checklist

When preparing screenshots or recording demo GIFs for GitHub and your portfolio, capture these specific views:

- [ ] **1. Dashboard Overview (`01-dashboard.png`)**: Full HUD dashboard showing active metrics, architecture matrix, live backend status indicator, and dark-mode slate theme.
- [ ] **2. Evidence Intake & Verification (`02-evidence-intake.png`)**: Evidence intake view showing log upload dropzone, SHA-256 hash badge, and raw line count validation.
- [ ] **3. Chronological Forensic Timeline (`03-timeline-view.png`)**: Tabular timeline showing attack stage badges (`AUTHENTICATION`, `EXECUTION`, `PRIVILEGE_ESCALATION`), timestamps, and highlighted suspicious events.
- [ ] **4. Threat Investigation Findings (`04-investigation-findings.png`)**: High-level verdict banner (`SUSPICIOUS_ACTIVITY_DETECTED`) and finding cards with confidence percentages, MITRE tags, and supporting event IDs.
- [ ] **5. Analyst Finding Adjudication (`05-analyst-review.png`)**: Interactive review modal showing `CONFIRMED` / `REJECTED` decision badges, editable fields, and finding-level analyst notes.
- [ ] **6. Saved Case Management (`06-case-management.png`)**: Saved cases grid displaying `LIN-YYYYMMDD-XXXXX` cards, search/filter controls, and status counters.
- [ ] **7. Formal Incident Report View (`07-incident-report.png`)**: Comprehensive 8-section report showing executive summary, metrics, adjudicated findings, and chronological evidence log.
- [ ] **8. Browser-Native Print-to-PDF Preview (`08-pdf-export-preview.png`)**: Chrome/Edge print preview dialog demonstrating `@media print` clean A4 portrait pagination with navigation UI hidden.

---

## 7. Recommended GitHub Repository Metadata

- **Repository Name**: `ai-linux-investigation-workspace`
- **Short Description (under 350 characters)**:
  > *Local Linux malware and privilege-escalation forensic workstation. Features deterministic threat correlation (GTFOBins, SUID, brute-force), analyst review workflows, browser-local case storage, and browser-native PDF/HTML incident reporting. Built with React, TypeScript, and FastAPI.*
- **Deployed Frontend URL**: `https://ai-linux-investigation-frontend.onrender.com/`
- **Deployed Backend API URL**: `https://ai-linux-investigation-workspace.onrender.com/`
- **Local Backend API (Dev)**: `http://127.0.0.1:8010/`
- **License**: MIT License
- **Suggested GitHub Topics**:
  `cybersecurity`, `incident-response`, `forensics`, `linux-security`, `privilege-escalation`, `threat-detection`, `gtfobins`, `mitre-attack`, `fastapi`, `react`, `typescript`, `vite`, `python`, `infosec`

---

## 8. Release Accuracy Recommendation (Task 3)

### Official Recommendation: Classify as **Portfolio / Demo v1.0.0 (Local Workstation MVP)**

> [!WARNING]
> **Do NOT describe this release as "Production-Ready Enterprise Software."**

### Rationale:
1. **Unauthenticated API**: The FastAPI backend currently exposes evidence ingestion and analysis endpoints without token verification. While safe on a local workstation bound to `127.0.0.1`, deploying this to an untrusted public cloud network without a reverse-proxy auth layer introduces unauthenticated execution risks.
2. **Missing Rate Limiting**: The backend lacks request rate limiting or upload throttling, making public endpoints vulnerable to resource saturation.
3. **Ephemeral Browser Storage**: Case records persist in the browser profile via `localStorage`. In enterprise SOC environments, incident records require server-side relational databases with ACID guarantees, multi-tenant row-level security, and offsite backups.
4. **Deterministic Heuristics Baseline**: While highly accurate for the targeted GTFOBins and Linux attack patterns, the detection engine uses fixed heuristics rather than a dynamic rule compiler (e.g., Sigma) or a benchmarked corpus. Detections can yield false positives or false negatives.

**Proper Framing for Recruiters & Hiring Managers**:
Highlight this project as an **exceptionally well-engineered, security-focused full-stack MVP**. Emphasize the architectural maturity shown by identifying these boundaries upfront, documenting a concrete 30-day remediation plan in [`docs/30-day-growth-plan.md`](file:///e:/PROJECTS/ai-linux-investigation-workspace-backup/docs/30-day-growth-plan.md), and verifying existing features with **84 automated tests**.

---

## 9. Proposed v1.0.0 Draft Release Notes

### Release Title:
`v1.0.0 — Portfolio Release: Local Linux Forensic Triage & Investigation Workstation`

### Release Summary:
This initial major release delivers a complete, end-to-end local investigation platform for Linux malware and privilege escalation triage. Designed as a privacy-first, zero-cloud-cost workstation, it provides security analysts with deterministic log correlation, interactive finding adjudication, browser-local case management, and publication-ready incident reports.

### What's New in v1.0.0:
- **Evidence Intake Pipeline**: Ingestion of Linux `auth.log`, `syslog`, and `auditd` files up to 5 MB with SHA-256 evidence fingerprinting supporting traceability and path traversal protections (`Path.is_relative_to`).
- **Forensic Timeline Sequencing**: Chronological reconstruction with automatic attack stage classification (`AUTHENTICATION`, `EXECUTION`, `PRIVILEGE_ESCALATION`, `PERSISTENCE`).
- **Deterministic Heuristic Detection Engine**: 5-stage correlation pipeline detecting GTFOBins `/usr/bin/find` exploits, SUID backdoor shell creation, `/etc/shadow` credential theft, SSH brute-forcing, and `/tmp` staging with mathematical confidence scores and MITRE ATT&CK mapping. Operates via deterministic rules without invoking an LLM for finding generation; detections can produce false positives or false negatives.
- **Analyst Case Adjudication**: Full review workflow (Confirm, Reject, Edit, Pend), finding notes, and browser `localStorage` persistence with standardized `LIN-YYYYMMDD-XXXXX` case identifiers.
- **Browser-Native Forensic Reporting**: 8-section report viewer with standalone sanitized HTML export (`escapeHtml` protection) and print-ready A4 PDF generation via `@media print` CSS.
- **Responsive Cybersecurity UI**: Sleek slate/cyan HUD interface featuring mobile drawer navigation (<768px), keyboard accessibility (`:focus-visible`), and ARIA labeling.
- **Automated Verification**: Verified across 71 backend Pytest tests, 13 standalone report verification tests, and 0 TypeScript compilation errors.

### Known Limitations:
- Endpoints are unauthenticated; suitable for local workstation use.
- Rate limiting is not currently implemented on ingestion endpoints.
- Cases are stored client-side in the browser profile.
- See [`docs/30-day-growth-plan.md`](docs/30-day-growth-plan.md) and [`docs/future-scope.md`](docs/future-scope.md) for the active roadmap.
