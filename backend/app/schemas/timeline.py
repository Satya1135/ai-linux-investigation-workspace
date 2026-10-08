from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.evidence import LogEventCandidate


class AttackStage(str, Enum):
    """
    Deterministic attack-stage classification vocabulary for Linux incident triage.
    """
    AUTHENTICATION = "AUTHENTICATION"
    RECONNAISSANCE = "RECONNAISSANCE"
    PRIVILEGE_DISCOVERY = "PRIVILEGE_DISCOVERY"
    PRIVILEGE_ESCALATION = "PRIVILEGE_ESCALATION"
    EXECUTION = "EXECUTION"
    PERSISTENCE = "PERSISTENCE"
    POST_EXPLOITATION = "POST_EXPLOITATION"
    OTHER = "OTHER"


class EventSeverity(str, Enum):
    """
    Standardized event severity rating.
    """
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TimelineEvent(BaseModel):
    """
    Chronologically sequenced timeline event with heuristic classification,
    suspicious behavior flags, and strict traceability to original evidence.
    """
    event_id: str = Field(..., description="Unique identifier for timeline event (e.g. evt-001)")
    timestamp: Optional[str] = Field(default=None, description="Parsed or raw event timestamp string")
    host: Optional[str] = Field(default=None, description="Extracted hostname if present in syslog header")
    process: Optional[str] = Field(default=None, description="Extracted daemon or process name (e.g. sshd, sudo)")
    event_type: str = Field(..., description="High-level SOC event category (AUTH, PRIVESC, EXEC, etc.)")
    message: str = Field(..., description="Cleaned message body without syslog prefix")
    raw_message: str = Field(..., description="Verbatim original log message line")
    original_event_index: int = Field(..., description="1-based index from normalized candidate events", ge=1)
    source_line_start: Optional[int] = Field(default=None, description="Starting line in source evidence", ge=1)
    source_line_end: Optional[int] = Field(default=None, description="Ending line in source evidence", ge=1)
    suspicious: bool = Field(default=False, description="True if heuristic rules flagged suspicious activity")
    severity: EventSeverity = Field(default=EventSeverity.INFO, description="Assigned severity rating")
    attack_stage: AttackStage = Field(default=AttackStage.OTHER, description="Inferred attack progression stage")
    highlight_reason: Optional[str] = Field(default=None, description="Concise explanation for why the event is flagged")
    classification_method: str = Field(default="rule_based", description="Classification origin (rule_based for Day 5)")


class TimelineRequest(BaseModel):
    """
    Request payload containing normalized candidate events for timeline reconstruction.
    """
    events: List[LogEventCandidate] = Field(
        ...,
        description="List of normalized log candidate events from Evidence Intake",
    )


class TimelineResponse(BaseModel):
    """
    Structured response containing the chronologically ordered timeline,
    attack stages detected, and suspicious event counts.
    """
    event_count: int = Field(..., description="Total count of events on the timeline", ge=0)
    suspicious_count: int = Field(..., description="Count of events flagged as suspicious", ge=0)
    stages_detected: List[AttackStage] = Field(
        default_factory=list,
        description="List of unique attack stages identified across events",
    )
    timeline: List[TimelineEvent] = Field(
        default_factory=list,
        description="Chronologically sequenced and analyzed timeline events",
    )
    classification_method: str = Field(
        default="rule_based",
        description="Method used for classification and detection",
    )
