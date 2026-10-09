# Day 6 — Milestone 1: Defensive Investigation Pipeline

## 1. Overview & Objectives

Milestone 1 implements a deterministic, evidence-grounded **Defensive Investigation Pipeline** for the AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace. 

The pipeline ingests chronologically sequenced `TimelineEvent` objects (produced by Evidence Intake and Timeline Sequencing), performs multi-stage sequence correlation across authentication, privilege discovery, privilege escalation, execution staging, persistence, and post-exploitation, calculates grounded confidence scores, suppresses uncorroborated low-confidence noise, and returns analyst-ready structured findings with complete provenance and transparent verdicts.

---

## 2. Architecture & Design Principles

### Transparent, Local Rule-Based Analysis (Zero External AI / Free Only)
- **Zero Paid APIs**: Absolutely no reliance on OpenAI, Anthropic, Gemini, external AI endpoints, or paid SaaS services.
- **Local Heuristics**: 100% deterministic, Python-based rule engine and sequence correlator.
- **Truthful Labelling**: Every response explicitly includes `"analysis_method": "rule_based"`.

### Strict Evidence Grounding & Zero Fabrication
- Every finding strictly references actual submitted timeline events (`supporting_events`) and original evidence line numbers (`original_event_indexes`).
- No hallucinated IP addresses, timestamps, hostnames, or attack stages.
- Timestamps, hosts, and processes are extracted directly from matched events without modification.

### Security Boundaries
- **Untrusted Inert Text**: All log messages, process parameters, command lines, and audit lines are treated strictly as inert strings.
- **Zero Command Execution**: Zero use of `eval()`, `exec()`, `os.system()`, `subprocess`, shell execution, or unsafe rendering. Commands embedded in log lines (e.g. `rm -rf /`, `find -exec /bin/sh`, `curl`, `chmod +x`) are never executed.
- **Payload Validation**: Strict Pydantic v2 schemas reject empty payloads (400 Bad Request), oversized requests >2000 events (400 Bad Request), and malformed payloads (422 Unprocessable Entity) with client-safe error messages.

---

## 3. Investigation Pipeline Stages

The pipeline executes through 5 structured stages and returns progress events in the `activities` response array:

```
[Timeline Events] 
       │
       ▼
 1. VALIDATION ──────────► Verify payload, size bounds, and event structure
       │
       ▼
 2. CORRELATION ─────────► Cluster by host, daemon/process, and attack stage
       │
       ▼
 3. SEQUENCE ANALYSIS ───► Detect multi-event attack patterns (auth -> privesc -> persist)
       │
       ▼
 4. CONFIDENCE & NOISE ──► Score grounded confidence (0.0 - 1.0); filter < 0.60 threshold
       │
       ▼
 5. RESULT PREPARATION ──► Deduplicate, prioritize findings, and determine transparent verdict
       │
       ▼
[Investigation Response]
```

### Correlation & Sequence Rules
1. **Authentication Anomaly (SSH Brute-Force)**:
   - Detects multiple failed authentication attempts (`sshd` failed password / invalid user).
   - If followed by accepted password for the target host/user: classified as `AUTHENTICATION_ANOMALY` (Severity: HIGH, Confidence: 0.95).
   - If repeated (3+ failures) without login: classified as automated brute-force (Severity: MEDIUM, Confidence: 0.75).
   - Single isolated failure: evaluated as weak indicator (Confidence: 0.35; filtered from analyst findings).

2. **Privilege Discovery to Privilege Escalation**:
   - Correlates user/permission enumeration (`id`, `whoami`, `sudo -l`) immediately preceding privileged escalation commands (`sudo`, `auditd` transition to EUID 0).
   - Severity: CRITICAL, Confidence: 0.95.

3. **GTFOBins Exploitation (Sudo Find Shell Spawn)**:
   - Identifies `sudo /usr/bin/find` executed with `-exec /bin/sh` or `/bin/bash` parameters and kernel audit `PRIV_ESCALATION` (`uid=1001 transitioned to euid=0`).
   - Severity: CRITICAL, Confidence: 0.95.

4. **Remote Payload Staging & Execution Preparation**:
   - Correlates `curl` / `wget` payload download into `/tmp` with subsequent permission modification (`chmod +x`).
   - Severity: HIGH, Confidence: 0.90.

5. **SUID Root Backdoor Persistence**:
   - Identifies staging of root shell binary to `/tmp/.rootshell` and permission change `mode=4755` (`suid=true`).
   - Severity: CRITICAL, Confidence: 0.95.

6. **Scheduled Root Cron Persistence**:
   - Identifies root cron daemon execution invoking staged executable in `/tmp`.
   - Severity: HIGH, Confidence: 0.90.

7. **Sensitive Credential Access (Post-Exploitation)**:
   - Identifies unauthorized read access to `/etc/shadow`.
   - Severity: CRITICAL, Confidence: 0.95.

---

## 4. Confidence Scoring Methodology

Confidence scores are deterministic, bounded between `0.0` and `1.0`, and derived from explicit criteria:

| Factor | Description | Weight / Impact |
|---|---|---|
| **Base Indicator Strength** | Kernel audit `PRIV_ESCALATION`, SUID 4755 mode, `/etc/shadow` access | Base 0.85 – 0.95 |
| **Multi-Stage Corroboration** | Sequential linkage (e.g. reconnaissance directly preceding escalation) | +0.10 to +0.15 boost |
| **Composite Action Linkage** | Correlated pairs (e.g. `curl` download + `chmod +x` permissions in `/tmp`) | Base 0.90 |
| **Repeated Volume** | 3+ repeated brute-force attempts | Base 0.75 |
| **Isolated Weak Indicator** | Single failed login or standalone routine `id` command | Base 0.35 – 0.40 |

### Confidence Threshold & Noise Exclusion
- **Threshold**: `0.60`
- **Analyst-Visible Findings**: Candidate findings with `confidence_score >= 0.60` are included in `findings`.
- **Low-Confidence Exclusion**: Candidate findings with `confidence_score < 0.60` are retained internally for correlation but excluded from analyst-visible `findings`. Their count is transparently reported as `low_confidence_excluded_count`.

---

## 5. Transparent Verdicts

The pipeline establishes one of three verdicts:

1. **`SUSPICIOUS_ACTIVITY_DETECTED`**:
   One or more high-confidence findings (`confidence >= 0.60`) confirmed malicious behavior.
2. **`NO_HIGH_CONFIDENCE_FINDINGS`**:
   All events reflect routine operational activity, or weak anomalies failed to meet the multi-event corroboration threshold.
3. **`INSUFFICIENT_EVIDENCE`**:
   Input payload contains fewer than 3 events with zero security anomalies, rendering conclusive analysis impossible.

---

## 6. API Endpoints

### 1. `POST /api/v1/investigation/analyze`
Executes investigation against submitted timeline events.

#### Request Body
```json
{
  "events": [
    {
      "event_id": "timeline-evt-001",
      "timestamp": "Oct 06 08:35:10",
      "host": "srv-corp-lnx01",
      "process": "sshd",
      "event_type": "AUTH_FAIL",
      "message": "Failed password for invalid user admin from 192.168.1.105",
      "raw_message": "Oct 06 08:35:10 srv-corp-lnx01 sshd[2104]: Failed password for invalid user admin from 192.168.1.105 port 43210 ssh2",
      "original_event_index": 4,
      "source_line_start": 4,
      "source_line_end": 4,
      "suspicious": true,
      "severity": "LOW",
      "attack_stage": "AUTHENTICATION",
      "highlight_reason": "SSH authentication failure",
      "classification_method": "rule_based"
    }
  ]
}
```

#### Response Body
```json
{
  "verdict": "SUSPICIOUS_ACTIVITY_DETECTED",
  "verdict_explanation": "Identified 6 high-confidence finding(s) indicating coordinated suspicious activity across attack stage(s): AUTHENTICATION_ANOMALY, PERSISTENCE, POST_EXPLOITATION, PRIVILEGE_ESCALATION, SUSPICIOUS_EXECUTION.",
  "total_events_analyzed": 30,
  "findings_count": 6,
  "low_confidence_excluded_count": 0,
  "findings": [
    {
      "finding_id": "fnd-001",
      "title": "Privilege Discovery Leading to Privilege Escalation",
      "severity": "CRITICAL",
      "category": "PRIVILEGE_ESCALATION",
      "explanation": "Unprivileged session performed privilege discovery (2 event(s), e.g. id / sudo -l), which was followed directly by elevated command execution yielding root privileges (EUID=0).",
      "supporting_events": ["timeline-evt-011", "timeline-evt-014", "timeline-evt-020", "timeline-evt-022"],
      "original_event_indexes": [11, 14, 20, 22],
      "timestamps": ["Oct 06 08:43:02", "Oct 06 08:43:45", "Oct 06 08:46:05", "Oct 06 08:46:06"],
      "hosts": ["srv-corp-lnx01"],
      "processes": ["sudo", "auditd"],
      "confidence_score": 0.95,
      "recommended_next_step": "Revoke sudo privileges for involved user, terminate active sessions, and inspect process ancestry."
    }
  ],
  "activities": [
    {
      "step": "VALIDATION",
      "message": "Successfully validated payload containing 30 timeline events with verified evidence provenance.",
      "timestamp": "2026-10-09T15:40:00.000Z",
      "details": { "event_count": 30 }
    },
    {
      "step": "CORRELATION",
      "message": "Correlated 30 events across 1 host(s) (srv-corp-lnx01), 5 process(es), and 6 attack stage(s). Identified 17 suspicious events.",
      "timestamp": "2026-10-09T15:40:00.005Z"
    },
    {
      "step": "SEQUENCE_ANALYSIS",
      "message": "Completed multi-stage sequence analysis. Generated 6 candidate findings.",
      "timestamp": "2026-10-09T15:40:00.010Z"
    },
    {
      "step": "CONFIDENCE_ASSESSMENT",
      "message": "Assessed confidence for 6 candidate findings. 6 findings met threshold (>= 0.6); 0 low-confidence indicator(s) retained for internal correlation but excluded from analyst view.",
      "timestamp": "2026-10-09T15:40:00.012Z"
    },
    {
      "step": "RESULT_PREPARATION",
      "message": "Investigation pipeline completed with verdict: SUSPICIOUS_ACTIVITY_DETECTED.",
      "timestamp": "2026-10-09T15:40:00.015Z"
    }
  ],
  "analysis_method": "rule_based"
}
```

### 2. `POST /api/v1/investigation/sample`
Executes end-to-end investigation on the pre-packaged sample scenario (`sample-privilege-escalation.log`).

---

## 7. Verification & Test Commands

### Backend Pytest Suite
Run from repository root:
```powershell
.venv\Scripts\pytest -q
```
**Result**: 59 passed in ~0.90s (45 regression tests + 14 new Day 6 investigation tests).

### Frontend Production Build
Run from repository root:
```powershell
cd frontend
npm run build
```
**Result**: 0 TypeScript errors, production build succeeds.
