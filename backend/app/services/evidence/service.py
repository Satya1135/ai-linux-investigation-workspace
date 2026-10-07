"""
Evidence Intake Service.

Responsible for:
- Input validation (source, file extension, size limits, empty/whitespace checks)
- Binary content rejection
- Deterministic SHA-256 generation
- Safe line ending normalization (CRLF/CR -> LF)
- Original raw evidence preservation without modification
- Lightweight candidate event extraction (untrusted text; no code execution)
"""

import hashlib
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Tuple

from backend.app.schemas.evidence import (
    EvidenceResponse,
    EvidenceSourceType,
    LogEventCandidate,
)
from backend.app.services.evidence.exceptions import (
    BinaryEvidenceError,
    EmptyEvidenceError,
    OversizedEvidenceError,
    SampleNotFoundError,
    UnsupportedExtensionError,
)

# Operational limits
MAX_EVIDENCE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {".log", ".txt"}
EXPLICITLY_REJECTED_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".ps1", ".sh", ".py", ".js", ".zip",
    ".bin", ".elf", ".so", ".dll", ".tar", ".gz", ".7z", ".rar",
}

# Compiled regex patterns for safe timestamp recognition
# 1. Traditional Syslog BSD format: "Oct 06 08:12:01" or "Oct  6 08:12:01"
SYSLOG_BSD_PATTERN = re.compile(
    r"^([A-Z][a-z]{2}\s+[0-9]{1,2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2})"
)

# 2. ISO 8601 / RFC 3339 format: "2026-10-06T08:12:01" or "2026-10-06 08:12:01"
ISO_TIMESTAMP_PATTERN = re.compile(
    r"^([0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}:?[0-9]{2})?)"
)

# 3. Linux auditd epoch timestamp: "audit(1728204270.112:89)"
AUDITD_TIMESTAMP_PATTERN = re.compile(
    r"audit\(([0-9]+(?:\.[0-9]+)?)"
)

# 4. Standard bracketed daemon/web timestamp: "[06/Oct/2026:08:12:01 +0000]"
BRACKETED_TIMESTAMP_PATTERN = re.compile(
    r"\[([0-9]{2}/[A-Z][a-z]{2}/[0-9]{4}:[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\s+[+-][0-9]{4})?)\]"
)


def extract_safe_timestamp(raw_line: str) -> Optional[str]:
    """
    Safely recognize and extract a timestamp string from a log line.
    Never evaluates, executes, or parses untrusted expressions.
    Guaranteed not to raise an exception on malformed or adversarial input.
    """
    if not raw_line or not isinstance(raw_line, str):
        return None

    try:
        # Check Syslog BSD format
        syslog_match = SYSLOG_BSD_PATTERN.search(raw_line.lstrip())
        if syslog_match:
            return syslog_match.group(1)

        # Check ISO 8601 format
        iso_match = ISO_TIMESTAMP_PATTERN.search(raw_line.lstrip())
        if iso_match:
            return iso_match.group(1)

        # Check Auditd epoch format
        audit_match = AUDITD_TIMESTAMP_PATTERN.search(raw_line)
        if audit_match:
            return f"epoch:{audit_match.group(1)}"

        # Check bracketed format
        bracket_match = BRACKETED_TIMESTAMP_PATTERN.search(raw_line)
        if bracket_match:
            return bracket_match.group(1)

        return None
    except Exception:
        # Fallback safety: never crash on malformed timestamp patterns
        return None


def get_sample_data_dir() -> Path:
    """
    Locates the sample-data/linux directory across different execution contexts.
    """
    candidates = [
        Path.cwd() / "sample-data" / "linux",
        Path(__file__).resolve().parents[4] / "sample-data" / "linux",
        Path(__file__).resolve().parents[3] / "sample-data" / "linux",
    ]
    for candidate in candidates:
        if candidate.is_dir():
            return candidate.resolve()
    # Default fallback to cwd relative
    return (Path.cwd() / "sample-data" / "linux").resolve()


class EvidenceService:
    """
    Service handling evidence validation, preservation, normalization, and candidate extraction.
    """

    @staticmethod
    def validate_filename_extension(filename: Optional[str]) -> None:
        """
        Validate that the uploaded file extension is permitted (.log or .txt).
        Explicitly rejects executable, script, and archive extensions.
        """
        if not filename:
            raise UnsupportedExtensionError("Uploaded file must have a filename.")

        ext = Path(filename).suffix.lower()
        if not ext:
            raise UnsupportedExtensionError(
                f"File '{filename}' has no extension. Allowed extensions are: .log, .txt"
            )

        if ext in EXPLICITLY_REJECTED_EXTENSIONS or ext not in ALLOWED_EXTENSIONS:
            raise UnsupportedExtensionError(
                f"Unsupported file extension '{ext}'. Only .log and .txt files are allowed."
            )

    @staticmethod
    def validate_raw_bytes(raw_bytes: bytes) -> str:
        """
        Validates raw bytes for:
        1. Non-empty check (len > 0)
        2. Size limit (<= 5 MB)
        3. Binary data check (no null bytes)
        4. Valid UTF-8 decoding
        Returns decoded text string.
        """
        byte_size = len(raw_bytes)
        if byte_size == 0:
            raise EmptyEvidenceError("Evidence input is empty (0 bytes).")

        if byte_size > MAX_EVIDENCE_SIZE_BYTES:
            raise OversizedEvidenceError(
                f"Evidence size ({byte_size:,} bytes) exceeds maximum allowed size of 5 MB ({MAX_EVIDENCE_SIZE_BYTES:,} bytes)."
            )

        # Check for binary null bytes
        if b"\x00" in raw_bytes:
            raise BinaryEvidenceError(
                "Evidence contains binary content (null bytes detected). Only plain text logs are supported."
            )

        # Ensure valid UTF-8 decode
        try:
            text = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise BinaryEvidenceError(
                "Evidence cannot be decoded as valid UTF-8 plain text."
            )

        return text

    @classmethod
    def process_evidence(
        cls,
        raw_bytes: bytes,
        source_type: EvidenceSourceType,
        filename: Optional[str] = None,
    ) -> EvidenceResponse:
        """
        Processes raw evidence bytes:
        - Validates size, non-empty, binary check, and UTF-8 encoding
        - Computes deterministic SHA-256 hash of original bytes
        - Preserves original raw text content
        - Performs safe normalization (CRLF/CR -> LF, trailing newlines stripped)
        - Extracts structured candidate log events without code execution
        """
        # Validate bytes and decode original text
        original_text = cls.validate_raw_bytes(raw_bytes)
        byte_size = len(raw_bytes)

        # Compute deterministic SHA-256 hash on original bytes
        sha256_hash = hashlib.sha256(raw_bytes).hexdigest()

        # Safe normalization:
        # Normalize line endings to LF
        normalized_content = original_text.replace("\r\n", "\n").replace("\r", "\n")
        # Remove only accidental empty trailing lines at the end of the file
        normalized_content = normalized_content.rstrip("\n")

        # Split into lines while preserving internal whitespace
        raw_lines = normalized_content.split("\n")

        candidates: List[LogEventCandidate] = []
        event_idx = 1

        for line_num, line in enumerate(raw_lines, start=1):
            # Skip empty lines to avoid producing empty candidate events
            if not line.strip():
                continue

            event_time = extract_safe_timestamp(line)
            candidates.append(
                LogEventCandidate(
                    event_index=event_idx,
                    source_line_number=line_num,
                    event_time=event_time,
                    raw_message=line,
                )
            )
            event_idx += 1

        if not candidates:
            raise EmptyEvidenceError("Evidence contains no valid log lines.")

        evidence_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc)

        return EvidenceResponse(
            evidence_id=evidence_id,
            source_type=source_type,
            filename=filename,
            byte_size=byte_size,
            original_content_sha256=sha256_hash,
            sha256_hash=sha256_hash,
            event_count=len(candidates),
            created_at=created_at,
            validation_status="valid",
            normalized_events=candidates,
            original_content=original_text,
            normalized_content=normalized_content,
        )

    @classmethod
    def process_pasted_evidence(
        cls,
        content: str,
        filename: Optional[str] = None,
    ) -> EvidenceResponse:
        """
        Process pasted evidence text.
        Rejects empty or whitespace-only input.
        """
        if not content or not content.strip():
            raise EmptyEvidenceError("Pasted evidence cannot be empty or whitespace-only.")

        raw_bytes = content.encode("utf-8")
        return cls.process_evidence(
            raw_bytes=raw_bytes,
            source_type=EvidenceSourceType.PASTE,
            filename=filename,
        )

    @classmethod
    def process_uploaded_file(
        cls,
        filename: str,
        raw_bytes: bytes,
    ) -> EvidenceResponse:
        """
        Process uploaded .log or .txt evidence file.
        Enforces extension validation, size limits, and non-empty checks.
        """
        cls.validate_filename_extension(filename)
        return cls.process_evidence(
            raw_bytes=raw_bytes,
            source_type=EvidenceSourceType.UPLOAD,
            filename=filename,
        )

    @classmethod
    def process_sample_scenario(
        cls,
        sample_name: str = "sample-privilege-escalation.log",
    ) -> EvidenceResponse:
        """
        Load and process pre-packaged sample Linux log scenario.
        Protected against directory traversal.
        """
        if not sample_name:
            sample_name = "sample-privilege-escalation.log"

        sample_dir = get_sample_data_dir()
        # Prevent directory traversal
        target_path = (sample_dir / sample_name).resolve()

        if not str(target_path).startswith(str(sample_dir)) or not target_path.is_file():
            raise SampleNotFoundError(
                f"Sample scenario '{sample_name}' does not exist in sample-data/linux/."
            )

        with open(target_path, "rb") as f:
            raw_bytes = f.read()

        return cls.process_evidence(
            raw_bytes=raw_bytes,
            source_type=EvidenceSourceType.SAMPLE,
            filename=sample_name,
        )

    @classmethod
    def list_available_samples(cls) -> List[str]:
        """
        Returns list of available sample log files in sample-data/linux/.
        """
        sample_dir = get_sample_data_dir()
        if not sample_dir.is_dir():
            return []
        return sorted([
            f.name for f in sample_dir.glob("*.log")
            if f.is_file() and not f.name.startswith(".")
        ])
