"""
Evidence service package.
"""

from backend.app.services.evidence.service import (
    EvidenceService,
    extract_safe_timestamp,
    MAX_EVIDENCE_SIZE_BYTES,
    ALLOWED_EXTENSIONS,
)
from backend.app.services.evidence.exceptions import (
    EvidenceException,
    UnsupportedExtensionError,
    OversizedEvidenceError,
    EmptyEvidenceError,
    BinaryEvidenceError,
    SampleNotFoundError,
    MalformedEvidenceError,
)

__all__ = [
    "EvidenceService",
    "extract_safe_timestamp",
    "MAX_EVIDENCE_SIZE_BYTES",
    "ALLOWED_EXTENSIONS",
    "EvidenceException",
    "UnsupportedExtensionError",
    "OversizedEvidenceError",
    "EmptyEvidenceError",
    "BinaryEvidenceError",
    "SampleNotFoundError",
    "MalformedEvidenceError",
]
