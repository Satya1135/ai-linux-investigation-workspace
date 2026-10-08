import re
from datetime import datetime
from typing import Any, List, Optional, Tuple

from backend.app.schemas.evidence import LogEventCandidate
from backend.app.schemas.timeline import (
    AttackStage,
    EventSeverity,
    TimelineEvent,
    TimelineResponse,
)

# Standard syslog pattern: "Oct 06 08:35:10 srv01 daemon[123]: message"
SYSLOG_PATTERN = re.compile(
    r"^([A-Za-z]{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+([^\s]+)\s+([^:]+):\s*(.*)$"
)

# Month mapping for sorting standard syslog timestamps
MONTH_MAP = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
}


class TimelineService:
    """
    Deterministic rule-based service for chronological sequencing,
    attack-stage classification, and suspicious event highlighting on Linux security logs.
    """

    @classmethod
    def _parse_timestamp_sort_key(cls, time_str: Optional[str], fallback_idx: int) -> Tuple[Any, ...]:
        """
        Extracts a comparable sort key from timestamp string.
        Falls back to original sequential index to ensure strict stable sorting.
        """
        if not time_str:
            return (9999, 12, 31, 23, 59, 59, fallback_idx)

        # Standard syslog: "Oct 06 08:12:01" or "Oct  6 08:12:01"
        match = re.match(r"^([A-Za-z]{3})\s+(\d+)\s+(\d{2}):(\d{2}):(\d{2})", time_str.strip())
        if match:
            month_str, day_str, hour_str, min_str, sec_str = match.groups()
            month = MONTH_MAP.get(month_str, 0)
            day = int(day_str)
            hour = int(hour_str)
            minute = int(min_str)
            second = int(sec_str)
            # Default reference year 2026 for month/day comparisons
            return (2026, month, day, hour, minute, second, fallback_idx)

        # ISO format: "2026-10-06T08:12:01" or "2026-10-06 08:12:01"
        try:
            cleaned = time_str.replace("Z", "").replace("T", " ")
            dt = datetime.fromisoformat(cleaned)
            return (dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, fallback_idx)
        except Exception:
            pass

        return (9999, 12, 31, 23, 59, 59, fallback_idx)

    @classmethod
    def _parse_syslog_header(cls, raw: str) -> Tuple[Optional[str], Optional[str], str]:
        """
        Safely extracts host and process from standard syslog header without modifying message text.
        """
        match = SYSLOG_PATTERN.match(raw)
        if match:
            _, host, process, msg = match.groups()
            return host.strip(), process.strip(), msg.strip()
        return None, None, raw

    @classmethod
    def _classify_event(
        cls,
        raw: str,
        process: Optional[str],
    ) -> Tuple[AttackStage, EventSeverity, str, bool, Optional[str]]:
        """
        Deterministic, transparent rule-based classification of Linux log lines.
        Returns: (attack_stage, severity, event_type, suspicious_flag, highlight_reason)
        """
        lower = raw.lower()
        proc_lower = (process or "").lower()

        # 1. Post-Exploitation & Credential Access
        if "/etc/shadow" in lower or "path=\"/etc/shadow\"" in lower or "cat\" path=\"/etc/shadow" in lower:
            return (
                AttackStage.POST_EXPLOITATION,
                EventSeverity.CRITICAL,
                "FILE_ACCESS",
                True,
                "Unauthorized access attempt to sensitive credential store (/etc/shadow)",
            )

        # 2. Critical Privilege Escalation Indicators
        if "priv_escalation" in lower or "transitioned to euid=0" in lower:
            return (
                AttackStage.PRIVILEGE_ESCALATION,
                EventSeverity.CRITICAL,
                "PRIVESC",
                True,
                "Kernel/Audit alert: Non-root user elevated to EUID=0 (root)",
            )

        if "mode=4755" in lower or "suid=true" in lower:
            return (
                AttackStage.PRIVILEGE_ESCALATION,
                EventSeverity.CRITICAL,
                "PRIVESC",
                True,
                "SUID permission (mode 4755) assigned to binary in /tmp",
            )

        if ".rootshell" in lower or "/tmp/.rootshell" in lower:
            return (
                AttackStage.PRIVILEGE_ESCALATION,
                EventSeverity.CRITICAL,
                "PRIVESC",
                True,
                "Creation or execution of SUID root backdoor shell (/tmp/.rootshell)",
            )

        if "sudo" in proc_lower and "find" in lower and ("/bin/sh" in lower or "-exec" in lower):
            return (
                AttackStage.PRIVILEGE_ESCALATION,
                EventSeverity.CRITICAL,
                "PRIVESC",
                True,
                "Sudo execution of /usr/bin/find with interactive shell spawn (GTFOBins pattern)",
            )

        # 3. Privilege Discovery & Reconnaissance (Check before generic sudo commands)
        if "sudo -l" in lower:
            return (
                AttackStage.PRIVILEGE_DISCOVERY,
                EventSeverity.MEDIUM,
                "PRIVESC_RECON",
                True,
                "Sudo privilege specification enumeration (sudo -l)",
            )

        if "command=/usr/bin/id" in lower or "command=/usr/bin/whoami" in lower or "whoami" in lower or "getent passwd" in lower:
            return (
                AttackStage.PRIVILEGE_DISCOVERY,
                EventSeverity.MEDIUM,
                "RECON",
                True,
                "User identity and group permissions discovery (id command)",
            )

        # 4. Privilege Escalation - Other Elevated Sudo Commands
        if "sudo" in proc_lower and "user=root" in lower and "command=" in lower:
            return (
                AttackStage.PRIVILEGE_ESCALATION,
                EventSeverity.HIGH,
                "PRIVESC",
                True,
                "Privileged root command executed via sudo",
            )

        if "sudo" in proc_lower and "session opened for user root" in lower:
            return (
                AttackStage.PRIVILEGE_ESCALATION,
                EventSeverity.HIGH,
                "PRIVESC",
                True,
                "Elevated root PAM session opened by unprivileged user",
            )

        # 5. Persistence
        if "cron" in proc_lower and ("/tmp" in lower or ".cache_updater" in lower):
            return (
                AttackStage.PERSISTENCE,
                EventSeverity.HIGH,
                "CRON_EXEC",
                True,
                "Automated cron execution invoking payload in /tmp",
            )

        if "cron" in proc_lower:
            return (
                AttackStage.PERSISTENCE,
                EventSeverity.INFO,
                "CRON",
                False,
                None,
            )

        # 6. Suspicious Execution & Staging
        if "curl" in lower and ("/tmp" in lower or "http://" in lower or "https://" in lower):
            return (
                AttackStage.EXECUTION,
                EventSeverity.HIGH,
                "EXEC",
                True,
                "Payload download and staging from remote IP via curl",
            )

        if "chmod" in lower and "+x" in lower and "/tmp" in lower:
            return (
                AttackStage.EXECUTION,
                EventSeverity.MEDIUM,
                "EXEC",
                True,
                "Executable permissions (+x) granted to staged binary in /tmp",
            )

        if "cmdline=\"/bin/sh -i\"" in lower or "cmdline=\"/bin/bash -i\"" in lower:
            return (
                AttackStage.EXECUTION,
                EventSeverity.CRITICAL,
                "EXEC",
                True,
                "Interactive root shell process spawned (/bin/sh -i)",
            )

        if "process_exec" in lower or "syscall=59" in lower:
            return (
                AttackStage.EXECUTION,
                EventSeverity.LOW,
                "PROCESS",
                False,
                None,
            )

        # 7. Authentication
        if "failed password" in lower or "invalid user" in lower:
            return (
                AttackStage.AUTHENTICATION,
                EventSeverity.LOW,
                "AUTH_FAIL",
                True,
                "SSH authentication failure (unauthorized user enumeration / brute-force attempt)",
            )

        if "accepted password" in lower:
            return (
                AttackStage.AUTHENTICATION,
                EventSeverity.INFO,
                "AUTH_SUCCESS",
                False,
                None,
            )

        if "session opened" in lower or "new session" in lower:
            return (
                AttackStage.AUTHENTICATION,
                EventSeverity.INFO,
                "AUTH_SESSION",
                False,
                None,
            )

        if "session closed" in lower or "logged out" in lower:
            return (
                AttackStage.AUTHENTICATION,
                EventSeverity.INFO,
                "AUTH_SESSION",
                False,
                None,
            )

        if "sshd" in proc_lower and "server listening" in lower:
            return (
                AttackStage.AUTHENTICATION,
                EventSeverity.INFO,
                "SERVICE_START",
                False,
                None,
            )

        # 8. System & Other
        if "systemd" in proc_lower or "apt-daily" in lower:
            return (
                AttackStage.OTHER,
                EventSeverity.INFO,
                "SYSTEM",
                False,
                None,
            )

        return (
            AttackStage.OTHER,
            EventSeverity.INFO,
            "LOG",
            False,
            None,
        )

    @classmethod
    def build_timeline(cls, candidate_events: List[LogEventCandidate]) -> TimelineResponse:
        """
        Accepts normalized candidate events, sorts them chronologically,
        applies transparent rule-based classification, and builds the timeline response.
        """
        if not candidate_events:
            return TimelineResponse(
                event_count=0,
                suspicious_count=0,
                stages_detected=[],
                timeline=[],
                classification_method="rule_based",
            )

        # Sort events chronologically while preserving index stability
        sorted_candidates = sorted(
            candidate_events,
            key=lambda c: cls._parse_timestamp_sort_key(c.event_time, c.event_index),
        )

        timeline_events: List[TimelineEvent] = []
        suspicious_count = 0
        detected_stages_set = set()

        for idx, cand in enumerate(sorted_candidates, start=1):
            raw = cand.raw_message
            host, process, message = cls._parse_syslog_header(raw)

            stage, severity, event_type, suspicious, reason = cls._classify_event(raw, process)

            if suspicious:
                suspicious_count += 1

            detected_stages_set.add(stage)

            evt = TimelineEvent(
                event_id=f"timeline-evt-{idx:03d}",
                timestamp=cand.event_time,
                host=host,
                process=process,
                event_type=event_type,
                message=message if message else raw,
                raw_message=raw,
                original_event_index=cand.event_index,
                source_line_start=cand.source_line_number,
                source_line_end=cand.source_line_number,
                suspicious=suspicious,
                severity=severity,
                attack_stage=stage,
                highlight_reason=reason,
                classification_method="rule_based",
            )
            timeline_events.append(evt)

        # Order detected stages logically
        stage_order = [
            AttackStage.AUTHENTICATION,
            AttackStage.RECONNAISSANCE,
            AttackStage.PRIVILEGE_DISCOVERY,
            AttackStage.PRIVILEGE_ESCALATION,
            AttackStage.EXECUTION,
            AttackStage.PERSISTENCE,
            AttackStage.POST_EXPLOITATION,
            AttackStage.OTHER,
        ]
        stages_detected = [s for s in stage_order if s in detected_stages_set]

        return TimelineResponse(
            event_count=len(timeline_events),
            suspicious_count=suspicious_count,
            stages_detected=stages_detected,
            timeline=timeline_events,
            classification_method="rule_based",
        )
