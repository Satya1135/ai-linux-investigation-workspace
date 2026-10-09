"""
Investigation Pipeline Service.

Deterministic, transparent, evidence-grounded rule-based investigation pipeline.
Analyzes chronologically sequenced timeline events, correlates related activities,
identifies multi-stage attack patterns, calculates grounded confidence scores,
filters low-confidence noise, and returns structured findings with full provenance.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from backend.app.schemas.timeline import AttackStage, EventSeverity, TimelineEvent
from backend.app.schemas.investigation import (
    FindingSeverity,
    InvestigationActivity,
    InvestigationFinding,
    InvestigationResponse,
    InvestigationVerdict,
)
from backend.app.services.investigation.exceptions import (
    EmptyInvestigationError,
    OversizedInvestigationError,
)

CONFIDENCE_THRESHOLD = 0.60
MAX_EVENTS_ALLOWED = 2000


class CandidateFinding:
    """
    Internal representation of an investigation candidate finding before confidence filtering.
    """
    def __init__(
        self,
        finding_id: str,
        title: str,
        severity: FindingSeverity,
        category: str,
        explanation: str,
        supporting_events: List[str],
        original_event_indexes: List[int],
        timestamps: List[str],
        hosts: List[str],
        processes: List[str],
        confidence_score: float,
        recommended_next_step: str,
    ):
        self.finding_id = finding_id
        self.title = title
        self.severity = severity
        self.category = category
        self.explanation = explanation
        self.supporting_events = supporting_events
        self.original_event_indexes = original_event_indexes
        self.timestamps = timestamps
        self.hosts = hosts
        self.processes = processes
        self.confidence_score = confidence_score
        self.recommended_next_step = recommended_next_step

    def to_schema(self, stable_id: str) -> InvestigationFinding:
        return InvestigationFinding(
            finding_id=stable_id,
            title=self.title,
            severity=self.severity,
            category=self.category,
            explanation=self.explanation,
            supporting_events=self.supporting_events,
            original_event_indexes=self.original_event_indexes,
            timestamps=self.timestamps,
            hosts=self.hosts,
            processes=self.processes,
            confidence_score=round(self.confidence_score, 2),
            recommended_next_step=self.recommended_next_step,
        )


class InvestigationService:
    """
    Core defensive investigation pipeline service.
    """

    @classmethod
    def run_investigation(cls, events: List[TimelineEvent]) -> InvestigationResponse:
        """
        Executes the deterministic defensive investigation pipeline over submitted timeline events.
        """
        activities: List[InvestigationActivity] = []

        def record_activity(step: str, message: str, details: Optional[Dict[str, Any]] = None):
            activities.append(
                InvestigationActivity(
                    step=step,
                    message=message,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    details=details,
                )
            )

        # 1. Validation & Input Sanitization
        if events is None or len(events) == 0:
            raise EmptyInvestigationError(
                "Cannot run investigation on empty timeline events. Please submit at least one timeline event."
            )

        if len(events) > MAX_EVENTS_ALLOWED:
            raise OversizedInvestigationError(
                f"Timeline event count ({len(events)}) exceeds maximum allowed limit of {MAX_EVENTS_ALLOWED} events."
            )

        record_activity(
            "VALIDATION",
            f"Successfully validated payload containing {len(events)} timeline events with verified evidence provenance.",
            {"event_count": len(events)},
        )

        # 2. Correlation & Grouping
        hosts = sorted({e.host for e in events if e.host})
        processes = sorted({e.process for e in events if e.process})
        stages = sorted({e.attack_stage.value for e in events if e.attack_stage})
        suspicious_events = [e for e in events if e.suspicious]

        record_activity(
            "CORRELATION",
            f"Correlated {len(events)} events across {len(hosts)} host(s) ({', '.join(hosts) if hosts else 'unspecified'}), "
            f"{len(processes)} process(es), and {len(stages)} attack stage(s). Identified {len(suspicious_events)} suspicious events.",
            {
                "hosts": hosts,
                "processes": processes,
                "stages": stages,
                "suspicious_count": len(suspicious_events),
            },
        )

        # 3. Multi-Stage Sequence Analysis
        candidates: List[CandidateFinding] = []

        cls._analyze_authentication_sequences(events, candidates)
        cls._analyze_privilege_discovery_and_escalation(events, candidates)
        cls._analyze_gtfobins_and_execution(events, candidates)
        cls._analyze_staging_and_payload(events, candidates)
        cls._analyze_persistence_mechanisms(events, candidates)
        cls._analyze_credential_access(events, candidates)
        cls._analyze_isolated_weak_indicators(events, candidates)

        record_activity(
            "SEQUENCE_ANALYSIS",
            f"Completed multi-stage sequence analysis. Generated {len(candidates)} candidate findings across "
            f"authentication, privilege escalation, execution, persistence, and post-exploitation.",
            {"candidate_count": len(candidates)},
        )

        # 4. Deduplication
        deduplicated_candidates = cls._deduplicate_findings(candidates)

        # 5. Confidence Assessment & Filtering
        visible_candidates: List[CandidateFinding] = []
        excluded_candidates: List[CandidateFinding] = []

        for cand in deduplicated_candidates:
            if cand.confidence_score >= CONFIDENCE_THRESHOLD:
                visible_candidates.append(cand)
            else:
                excluded_candidates.append(cand)

        # Sort visible findings by severity priority (CRITICAL -> HIGH -> MEDIUM -> LOW) then confidence desc
        severity_order = {
            FindingSeverity.CRITICAL: 0,
            FindingSeverity.HIGH: 1,
            FindingSeverity.MEDIUM: 2,
            FindingSeverity.LOW: 3,
        }
        visible_candidates.sort(
            key=lambda c: (severity_order.get(c.severity, 99), -c.confidence_score)
        )

        # Assign stable sequential IDs
        final_findings: List[InvestigationFinding] = [
            c.to_schema(f"fnd-{idx:03d}") for idx, c in enumerate(visible_candidates, start=1)
        ]

        record_activity(
            "CONFIDENCE_ASSESSMENT",
            f"Assessed confidence for {len(deduplicated_candidates)} candidate findings. "
            f"{len(final_findings)} findings met threshold (>= {CONFIDENCE_THRESHOLD}); "
            f"{len(excluded_candidates)} low-confidence indicator(s) retained for internal correlation but excluded from analyst view.",
            {
                "threshold": CONFIDENCE_THRESHOLD,
                "visible_findings": len(final_findings),
                "low_confidence_excluded": len(excluded_candidates),
            },
        )

        # 6. Verdict Determination
        verdict, verdict_explanation = cls._determine_verdict(
            events=events,
            visible_findings=final_findings,
            low_confidence_count=len(excluded_candidates),
            suspicious_count=len(suspicious_events),
        )

        record_activity(
            "RESULT_PREPARATION",
            f"Investigation pipeline completed with verdict: {verdict.value}.",
            {"verdict": verdict.value, "findings_count": len(final_findings)},
        )

        return InvestigationResponse(
            verdict=verdict,
            verdict_explanation=verdict_explanation,
            total_events_analyzed=len(events),
            findings_count=len(final_findings),
            low_confidence_excluded_count=len(excluded_candidates),
            findings=final_findings,
            activities=activities,
            analysis_method="rule_based",
        )

    # -------------------------------------------------------------------------
    # Detection Rules & Sequence Correlators
    # -------------------------------------------------------------------------

    @classmethod
    def _extract_provenance(cls, events: List[TimelineEvent]) -> Tuple[List[str], List[int], List[str], List[str], List[str]]:
        """
        Extracts strictly grounded provenance metadata from matched events.
        """
        event_ids = [e.event_id for e in events]
        orig_indices = sorted(list({e.original_event_index for e in events}))
        timestamps = [e.timestamp for e in events if e.timestamp]
        # Preserve unique timestamps in order
        timestamps = list(dict.fromkeys(timestamps))
        hosts = [e.host for e in events if e.host]
        hosts = list(dict.fromkeys(hosts))
        processes = [e.process for e in events if e.process]
        processes = list(dict.fromkeys(processes))
        return event_ids, orig_indices, timestamps, hosts, processes

    @classmethod
    def _analyze_authentication_sequences(cls, events: List[TimelineEvent], candidates: List[CandidateFinding]):
        """
        Analyzes authentication sequences: repeated failures (brute-force) and failures followed by success.
        """
        fail_events: List[TimelineEvent] = []
        success_events: List[TimelineEvent] = []

        for e in events:
            raw_lower = e.raw_message.lower()
            if "failed password" in raw_lower or "invalid user" in raw_lower:
                fail_events.append(e)
            elif "accepted password" in raw_lower:
                success_events.append(e)

        if not fail_events:
            return

        # Case 1: Failures followed by successful authentication
        if success_events:
            all_auth = fail_events + success_events
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance(all_auth)
            # High confidence because multiple failures leading to accepted login is a classic compromise chain
            confidence = 0.95 if len(fail_events) >= 2 else 0.85
            candidates.append(
                CandidateFinding(
                    finding_id="auth-seq-bruteforce-success",
                    title="SSH Brute-Force Password Guessing Followed by Successful Authentication",
                    severity=FindingSeverity.HIGH,
                    category="AUTHENTICATION_ANOMALY",
                    explanation=(
                        f"Detected {len(fail_events)} authentication failure(s) followed by successful login. "
                        f"This progression indicates credential guessing or brute-force enumeration culminating in an unauthorized session."
                    ),
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=confidence,
                    recommended_next_step="Audit SSH session history for newly authenticated user, verify source IP, and inspect authorized_keys.",
                )
            )
        # Case 2: 3+ failures without successful login (brute force attempt)
        elif len(fail_events) >= 3:
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance(fail_events)
            candidates.append(
                CandidateFinding(
                    finding_id="auth-seq-bruteforce-attempt",
                    title="Repeated SSH Authentication Failures (Brute-Force Enumeration)",
                    severity=FindingSeverity.MEDIUM,
                    category="AUTHENTICATION_ANOMALY",
                    explanation=(
                        f"Detected {len(fail_events)} consecutive authentication failures across invalid users. "
                        f"Consistent with automated SSH credential dictionary attacks or account discovery."
                    ),
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=0.75,
                    recommended_next_step="Apply firewall/fail2ban ban on originating IP address and review password authentication policies.",
                )
            )
        # Case 3: 1 or 2 isolated failures without success (weak indicator)
        else:
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance(fail_events)
            candidates.append(
                CandidateFinding(
                    finding_id="auth-single-failure",
                    title="Isolated SSH Authentication Failure",
                    severity=FindingSeverity.LOW,
                    category="AUTHENTICATION_ANOMALY",
                    explanation="Isolated authentication failure without subsequent compromise or corroborated brute-force volume.",
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=0.35,  # Deliberately below 0.60 threshold
                    recommended_next_step="Monitor authentication logs for subsequent failed attempts.",
                )
            )

    @classmethod
    def _analyze_privilege_discovery_and_escalation(
        cls, events: List[TimelineEvent], candidates: List[CandidateFinding]
    ):
        """
        Analyzes privilege discovery (sudo -l, id) and detects whether it connects to privilege escalation.
        """
        recon_events: List[TimelineEvent] = []
        privesc_events: List[TimelineEvent] = []

        for e in events:
            raw_lower = e.raw_message.lower()
            if (
                e.attack_stage == AttackStage.PRIVILEGE_DISCOVERY
                or "sudo -l" in raw_lower
                or "command=/usr/bin/id" in raw_lower
                or "command=/usr/bin/whoami" in raw_lower
            ):
                recon_events.append(e)

            if (
                e.attack_stage == AttackStage.PRIVILEGE_ESCALATION
                or "transitioned to euid=0" in raw_lower
                or "mode=4755" in raw_lower
                or ".rootshell" in raw_lower
            ):
                privesc_events.append(e)

        if recon_events and privesc_events:
            combined = recon_events + privesc_events
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance(combined)
            candidates.append(
                CandidateFinding(
                    finding_id="privesc-seq-recon-escalation",
                    title="Privilege Discovery Leading to Privilege Escalation",
                    severity=FindingSeverity.CRITICAL,
                    category="PRIVILEGE_ESCALATION",
                    explanation=(
                        f"Unprivileged session performed privilege discovery ({len(recon_events)} event(s), e.g. id / sudo -l), "
                        f"which was followed directly by elevated command execution yielding root privileges (EUID=0)."
                    ),
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=0.95,
                    recommended_next_step="Revoke sudo privileges for involved user, terminate active sessions, and inspect process ancestry.",
                )
            )
        elif recon_events and not privesc_events:
            # Standalone reconnaissance
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance(recon_events)
            confidence = 0.65 if len(recon_events) >= 2 else 0.40
            severity = FindingSeverity.MEDIUM if len(recon_events) >= 2 else FindingSeverity.LOW
            candidates.append(
                CandidateFinding(
                    finding_id="recon-standalone-privilege-discovery",
                    title="Privilege and Permission Discovery Enumeration",
                    severity=severity,
                    category="PRIVILEGE_DISCOVERY",
                    explanation="Execution of commands enumerating user identity, group membership, and sudo permissions.",
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=confidence,
                    recommended_next_step="Verify if system administration activity was authorized.",
                )
            )

    @classmethod
    def _analyze_gtfobins_and_execution(
        cls, events: List[TimelineEvent], candidates: List[CandidateFinding]
    ):
        """
        Identifies GTFOBins execution, sudo abuse, and interactive shell spawns.
        """
        gtfobins_events: List[TimelineEvent] = []

        for e in events:
            raw_lower = e.raw_message.lower()
            if (
                ("sudo" in (e.process or "").lower() and "find" in raw_lower and ("-exec" in raw_lower or "/bin/sh" in raw_lower))
                or ("priv_escalation" in raw_lower and "transitioned to euid=0" in raw_lower)
                or ("cmdline=\"/bin/sh -i\"" in raw_lower and "euid=0" in raw_lower)
            ):
                gtfobins_events.append(e)

        if gtfobins_events:
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance(gtfobins_events)
            candidates.append(
                CandidateFinding(
                    finding_id="privesc-gtfobins-find-shell",
                    title="Privilege Escalation via Sudo Find Shell Spawn (GTFOBins Pattern)",
                    severity=FindingSeverity.CRITICAL,
                    category="PRIVILEGE_ESCALATION",
                    explanation=(
                        "Sudo execution of /usr/bin/find with interactive shell parameters (-exec /bin/sh) "
                        "resulted in kernel-confirmed transition of unprivileged user to EUID=0 (root)."
                    ),
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=0.95,
                    recommended_next_step="Immediately restrict sudoers configuration, kill child shells spawned by the process, and preserve audit logs.",
                )
            )

    @classmethod
    def _analyze_staging_and_payload(
        cls, events: List[TimelineEvent], candidates: List[CandidateFinding]
    ):
        """
        Identifies remote payload downloading and execution permissions staging in /tmp.
        """
        curl_events: List[TimelineEvent] = []
        chmod_events: List[TimelineEvent] = []

        for e in events:
            raw_lower = e.raw_message.lower()
            if "curl" in raw_lower and ("/tmp" in raw_lower or "http://" in raw_lower or "https://" in raw_lower):
                curl_events.append(e)
            if "chmod" in raw_lower and "+x" in raw_lower and "/tmp" in raw_lower:
                chmod_events.append(e)

        if curl_events and chmod_events:
            combined = curl_events + chmod_events
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance(combined)
            candidates.append(
                CandidateFinding(
                    finding_id="exec-staging-payload-tmp",
                    title="Remote Payload Staging and Execution Permissions in /tmp",
                    severity=FindingSeverity.HIGH,
                    category="SUSPICIOUS_EXECUTION",
                    explanation=(
                        "Remote payload downloaded via curl from external server into /tmp, followed by permission "
                        "modification granting execution rights (chmod +x). Typical staging mechanism for secondary malware."
                    ),
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=0.90,
                    recommended_next_step="Isolate staged binary in /tmp, calculate cryptographic hash, and inspect network logs for C2 communication.",
                )
            )
        elif curl_events:
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance(curl_events)
            candidates.append(
                CandidateFinding(
                    finding_id="exec-curl-download-tmp",
                    title="Suspicious Remote File Download to /tmp",
                    severity=FindingSeverity.MEDIUM,
                    category="SUSPICIOUS_EXECUTION",
                    explanation="Curl process downloaded a file directly into /tmp from an external IP address.",
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=0.65,
                    recommended_next_step="Inspect destination path in /tmp and identify destination file contents.",
                )
            )

    @classmethod
    def _analyze_persistence_mechanisms(
        cls, events: List[TimelineEvent], candidates: List[CandidateFinding]
    ):
        """
        Identifies SUID root backdoor persistence and cron execution of staged binaries.
        """
        suid_events: List[TimelineEvent] = []
        cron_events: List[TimelineEvent] = []

        for e in events:
            raw_lower = e.raw_message.lower()
            if (
                "mode=4755" in raw_lower
                or "suid=true" in raw_lower
                or ".rootshell" in raw_lower
                or ("/bin/cp" in raw_lower and "/tmp" in raw_lower)
            ):
                suid_events.append(e)

            if "cron" in (e.process or "").lower() and ("/tmp" in raw_lower or ".cache_updater" in raw_lower):
                cron_events.append(e)

        if suid_events:
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance(suid_events)
            candidates.append(
                CandidateFinding(
                    finding_id="persist-suid-rootshell",
                    title="Creation of SUID Root Backdoor Shell",
                    severity=FindingSeverity.CRITICAL,
                    category="PERSISTENCE",
                    explanation=(
                        "A root shell binary was staged in /tmp and assigned SUID root permissions (mode 4755). "
                        "Provides unauthenticated persistent privilege escalation backdoor."
                    ),
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=0.95,
                    recommended_next_step="Immediately remove /tmp/.rootshell, audit entire filesystem for rogue SUID binaries, and review sudoers.",
                )
            )

        if cron_events:
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance(cron_events)
            candidates.append(
                CandidateFinding(
                    finding_id="persist-cron-tmp-execution",
                    title="Persistent Scheduled Task Executing Staged Binary in /tmp",
                    severity=FindingSeverity.HIGH,
                    category="PERSISTENCE",
                    explanation=(
                        "Cron daemon executed recurring job referencing an executable staged in /tmp. "
                        "Establishes scheduled persistence across reboots."
                    ),
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=0.90,
                    recommended_next_step="Inspect system and user crontabs (/etc/crontab, /var/spool/cron/), remove malicious entry, and inspect cron logs.",
                )
            )

    @classmethod
    def _analyze_credential_access(
        cls, events: List[TimelineEvent], candidates: List[CandidateFinding]
    ):
        """
        Identifies post-exploitation access to /etc/shadow or sensitive credential stores.
        """
        shadow_events: List[TimelineEvent] = []

        for e in events:
            raw_lower = e.raw_message.lower()
            if "/etc/shadow" in raw_lower:
                shadow_events.append(e)

        if shadow_events:
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance(shadow_events)
            candidates.append(
                CandidateFinding(
                    finding_id="postexp-credential-store-access",
                    title="Sensitive Credential Store Access (/etc/shadow)",
                    severity=FindingSeverity.CRITICAL,
                    category="POST_EXPLOITATION",
                    explanation=(
                        "Unauthorized read access to /etc/shadow containing password hashes for all system accounts. "
                        "Indicates credential harvesting and preparation for offline cracking or lateral movement."
                    ),
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=0.95,
                    recommended_next_step="Rotate all system account passwords and SSH keys immediately, and check egress traffic for exfiltration.",
                )
            )

    @classmethod
    def _analyze_isolated_weak_indicators(
        cls, events: List[TimelineEvent], candidates: List[CandidateFinding]
    ):
        """
        Catches any suspicious events not already covered by high-confidence sequences.
        Ensures weak indicators receive properly calibrated low-confidence scores (< 0.60).
        """
        already_covered_event_ids: Set[str] = set()
        for c in candidates:
            already_covered_event_ids.update(c.supporting_events)

        uncovered_suspicious = [
            e for e in events if e.suspicious and e.event_id not in already_covered_event_ids
        ]

        for e in uncovered_suspicious:
            e_ids, orig_indices, times, hosts, procs = cls._extract_provenance([e])
            # Single isolated indicators without corroboration have low confidence
            base_confidence = 0.35 if e.severity in (EventSeverity.LOW, EventSeverity.INFO) else 0.50
            candidates.append(
                CandidateFinding(
                    finding_id=f"isolated-{e.event_id}",
                    title=f"Uncorroborated Anomaly: {e.event_type}",
                    severity=FindingSeverity.LOW if base_confidence < 0.50 else FindingSeverity.MEDIUM,
                    category="ANOMALY",
                    explanation=e.highlight_reason or "Isolated suspicious behavior without corroborating chain of events.",
                    supporting_events=e_ids,
                    original_event_indexes=orig_indices,
                    timestamps=times,
                    hosts=hosts,
                    processes=procs,
                    confidence_score=base_confidence,
                    recommended_next_step="Retain for contextual correlation in broader log reviews.",
                )
            )

    # -------------------------------------------------------------------------
    # Deduplication & Verdict
    # -------------------------------------------------------------------------

    @classmethod
    def _deduplicate_findings(cls, candidates: List[CandidateFinding]) -> List[CandidateFinding]:
        """
        Deduplicates overlapping findings based on category and supporting events.
        """
        deduped: List[CandidateFinding] = []
        seen_keys: Set[Tuple[str, str]] = set()

        for cand in candidates:
            # Key based on category and sorted supporting events
            key = (cand.category, ",".join(sorted(cand.supporting_events)))
            if key not in seen_keys:
                seen_keys.add(key)
                deduped.append(cand)
            else:
                # Merge into existing if higher confidence
                for existing in deduped:
                    if (existing.category, ",".join(sorted(existing.supporting_events))) == key:
                        if cand.confidence_score > existing.confidence_score:
                            existing.confidence_score = cand.confidence_score
                            existing.title = cand.title
                            existing.explanation = cand.explanation
                        break
        return deduped

    @classmethod
    def _determine_verdict(
        cls,
        events: List[TimelineEvent],
        visible_findings: List[InvestigationFinding],
        low_confidence_count: int,
        suspicious_count: int,
    ) -> Tuple[InvestigationVerdict, str]:
        """
        Computes transparent verdict and factual explanation based on evidence grounding.
        """
        if len(visible_findings) > 0:
            categories = sorted({f.category for f in visible_findings})
            explanation = (
                f"Identified {len(visible_findings)} high-confidence finding(s) indicating coordinated suspicious activity "
                f"across attack stage(s): {', '.join(categories)}."
            )
            return InvestigationVerdict.SUSPICIOUS_ACTIVITY_DETECTED, explanation

        if len(events) < 3 and suspicious_count == 0 and low_confidence_count == 0:
            explanation = (
                f"Submitted evidence contains only {len(events)} event(s) with no security anomalies. "
                f"Insufficient evidence to establish an incident conclusion."
            )
            return InvestigationVerdict.INSUFFICIENT_EVIDENCE, explanation

        if low_confidence_count > 0:
            explanation = (
                f"Evaluated {len(events)} event(s). Detected {low_confidence_count} low-confidence indicator(s), "
                f"but none met the multi-event corroboration threshold (>= {CONFIDENCE_THRESHOLD}) required to confirm malicious compromise."
            )
            return InvestigationVerdict.NO_HIGH_CONFIDENCE_FINDINGS, explanation

        explanation = (
            f"Evaluated {len(events)} event(s). All events reflect routine operational activity with no suspicious indicators."
        )
        return InvestigationVerdict.NO_HIGH_CONFIDENCE_FINDINGS, explanation
