from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class EvidenceSourceType(str, Enum):
    """
    Evidence intake source classification.
    """
    SAMPLE = "sample"
    UPLOAD = "upload"
    PASTE = "paste"


class PastedEvidenceRequest(BaseModel):
    """
    Request payload for pasted Linux log evidence.
    """
    content: str = Field(
        ...,
        description="Raw Linux log text pasted by the analyst",
        examples=["Oct 06 08:12:01 srv01 systemd[1]: Starting Daily apt download activities..."],
    )
    filename: Optional[str] = Field(
        default=None,
        description="Optional logical filename or label for the evidence (e.g. auth.log)",
        max_length=255,
    )
    description: Optional[str] = Field(
        default=None,
        description="Optional description of the evidence source",
        max_length=500,
    )


class SampleEvidenceRequest(BaseModel):
    """
    Request payload for loading a pre-packaged sample Linux log scenario.
    """
    sample_name: Optional[str] = Field(
        default="sample-privilege-escalation.log",
        description="Filename of the sample scenario located in sample-data/linux/",
        max_length=255,
    )


class LogEventCandidate(BaseModel):
    """
    Lightweight, safely extracted candidate representation of a single log event.
    Untrusted text data is preserved without evaluation or command execution.
    """
    event_index: int = Field(
        ...,
        description="1-based sequential index of the log event candidate",
        ge=1,
    )
    source_line_number: int = Field(
        ...,
        description="1-based line number in the source evidence",
        ge=1,
    )
    event_time: Optional[str] = Field(
        default=None,
        description="Safely recognized timestamp string if available, null otherwise",
    )
    raw_message: str = Field(
        ...,
        description="Original verbatim log line message (unexecuted text)",
    )


class EvidenceMetadata(BaseModel):
    """
    Summary metadata for an ingested evidence item.
    """
    evidence_id: str = Field(..., description="Unique UUID identifier for this evidence intake")
    source_type: EvidenceSourceType = Field(..., description="Intake source type (sample, upload, paste)")
    filename: Optional[str] = Field(default=None, description="Original filename if applicable")
    byte_size: int = Field(..., description="Total byte size of the original unedited evidence", ge=0)
    original_content_sha256: str = Field(..., description="Deterministic SHA-256 hex digest of the raw evidence")
    sha256_hash: str = Field(..., description="SHA-256 hash alias for API consistency")
    event_count: int = Field(..., description="Number of candidate events extracted", ge=0)
    created_at: datetime = Field(..., description="Timestamp when evidence was ingested")
    validation_status: str = Field(default="valid", description="Validation status of the intake")


class EvidenceResponse(BaseModel):
    """
    Standard structured response returned by evidence intake endpoints.
    Includes metadata, normalized candidate events, and preserved original content.
    """
    evidence_id: str = Field(..., description="Unique UUID identifier for this evidence item")
    source_type: EvidenceSourceType = Field(..., description="Intake source type (sample, upload, paste)")
    filename: Optional[str] = Field(default=None, description="Filename if applicable")
    byte_size: int = Field(..., description="Byte size of original evidence")
    original_content_sha256: str = Field(..., description="Deterministic SHA-256 hex digest of raw evidence")
    sha256_hash: str = Field(..., description="SHA-256 hash alias")
    event_count: int = Field(..., description="Count of parsed event candidates")
    created_at: datetime = Field(..., description="Timestamp of evidence intake")
    validation_status: str = Field(default="valid", description="Validation status")
    normalized_events: List[LogEventCandidate] = Field(
        default_factory=list,
        description="Structured candidate events safely extracted from normalized text",
    )
    original_content: str = Field(
        ...,
        description="Original evidence preserved verbatim exactly as received",
    )
    normalized_content: str = Field(
        ...,
        description="Normalized representation with LF line endings and trailing lines trimmed",
    )


class EvidenceErrorResponse(BaseModel):
    """
    Standard structured error response for evidence validation errors.
    Prevents exposing internal stack traces.
    """
    detail: str = Field(..., description="Human-readable description of the error")
    error_code: str = Field(..., description="Machine-readable error classification code")
