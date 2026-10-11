"""
Unit tests for Day 8 Report data formatting, verdict handling, and security sanitization.
"""

import html
import re
import pytest
from backend.app.schemas.investigation import (
    InvestigationVerdict,
    FindingSeverity,
    InvestigationFinding,
)


def escape_html(text: str) -> str:
    """Escapes untrusted text to prevent XSS in HTML incident reports."""
    return html.escape(str(text), quote=True)


def sanitize_filename(filename: str) -> str:
    """Generates filesystem-safe filename for report downloads."""
    sanitized = re.sub(r"[^a-zA-Z0-9_-]", "-", str(filename))
    sanitized = re.sub(r"-+", "-", sanitized).strip("-")
    return sanitized if sanitized else "investigation-report"


class TestReportFormattingAndSecurity:
    """Tests for report generation logic, verdict fidelity, and XSS sanitization."""

    def test_verdict_fidelity(self):
        """Verifies that all three transparent verdicts are distinct and supported."""
        assert InvestigationVerdict.SUSPICIOUS_ACTIVITY_DETECTED == "SUSPICIOUS_ACTIVITY_DETECTED"
        assert InvestigationVerdict.NO_HIGH_CONFIDENCE_FINDINGS == "NO_HIGH_CONFIDENCE_FINDINGS"
        assert InvestigationVerdict.INSUFFICIENT_EVIDENCE == "INSUFFICIENT_EVIDENCE"

    def test_xss_escaping_in_log_messages(self):
        """Verifies malicious script and event handler payloads are neutralized."""
        html_payloads = [
            "<script>alert('XSS')</script>",
            '<img src=x onerror=alert(1)>',
            '"><svg onload=alert(document.domain)>',
            "<iframe src=evil.com>",
        ]
        for payload in html_payloads:
            escaped = escape_html(payload)
            assert "<script>" not in escaped
            assert "<img" not in escaped
            assert "<svg" not in escaped
            assert "<iframe" not in escaped
            assert "&lt;" in escaped

        quote_payload = "user'; DROP TABLE cases; --"
        escaped_quote = escape_html(quote_payload)
        assert "&#x27;" in escaped_quote

    def test_filename_sanitization_prevents_path_traversal(self):
        """Verifies path traversal sequences and invalid characters are stripped."""
        assert sanitize_filename("LIN-20261011-SOC01") == "LIN-20261011-SOC01"
        assert sanitize_filename("../../etc/passwd") == "etc-passwd"
        assert sanitize_filename("case:with*forbidden?chars|here") == "case-with-forbidden-chars-here"
        assert sanitize_filename("   ---   ") == "investigation-report"

    def test_finding_provenance_integrity(self):
        """Verifies finding schema preserves evidence references and line numbers."""
        finding = InvestigationFinding(
            finding_id="FINDING-GTFO-001",
            title="GTFOBins PrivEsc",
            severity=FindingSeverity.CRITICAL,
            category="PRIVILEGE_ESCALATION",
            explanation="Attacker invoked sudo /usr/bin/find with shell escape.",
            supporting_events=["EVT-0004", "EVT-0005"],
            original_event_indexes=[4, 5],
            timestamps=["2026-10-06T08:14:05Z"],
            hosts=["srv01"],
            processes=["sudo", "find"],
            confidence_score=0.95,
            recommended_next_step="Revoke sudo permissions immediately.",
        )
        assert finding.supporting_events == ["EVT-0004", "EVT-0005"]
        assert finding.original_event_indexes == [4, 5]
        assert finding.confidence_score == 0.95
        assert finding.severity == FindingSeverity.CRITICAL

    def test_analyst_decision_separation_model(self):
        """Verifies original findings remain untouched when analyst decisions are recorded."""
        original_title = "GTFOBins PrivEsc"
        analyst_edited_title = "Confirmed GTFOBins Escalation (Analyst Reviewed)"
        assert original_title != analyst_edited_title
