from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.timeline import TimelineEvent


class FindingSeverity(str, Enum):
    """
    Standardized finding severity ratings.
    """
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class InvestigationVerdict(str, Enum):
    """
    Transparent investigation verdict vocabulary.
    """
    SUSPICIOUS_ACTIVITY_DETECTED = "SUSPICIOUS_ACTIVITY_DETECTED"
    NO_HIGH_CONFIDENCE_FINDINGS = "NO_HIGH_CONFIDENCE_FINDINGS"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class InvestigationFinding(BaseModel):
    """
    Structured SOC investigation finding grounded in actual submitted timeline events.
    """
    finding_id: str = Field(..., description="Stable unique identifier for the finding")
    title: str = Field(..., description="Descriptive title summarizing the detected activity")
    severity: FindingSeverity = Field(..., description="Assigned severity rating: LOW, MEDIUM, HIGH, CRITICAL")
    category: str = Field(..., description="SOC finding category (e.g. PRIVILEGE_ESCALATION, PERSISTENCE)")
    explanation: str = Field(..., description="Clear explanation of why this activity is suspicious")
    supporting_events: List[str] = Field(..., description="Timeline event IDs corroborating this finding")
    original_event_indexes: List[int] = Field(..., description="1-based original event indexes from evidence")
    timestamps: List[str] = Field(default_factory=list, description="Relevant timestamps observed")
    hosts: List[str] = Field(default_factory=list, description="Relevant hosts involved")
    processes: List[str] = Field(default_factory=list, description="Relevant processes involved")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Deterministic confidence score between 0.0 and 1.0")
    recommended_next_step: str = Field(..., description="Concise recommended next step for the analyst")


class InvestigationActivity(BaseModel):
    """
    Structured activity event showing transparent progress through pipeline stages.
    """
    step: str = Field(..., description="Pipeline execution stage (e.g. VALIDATION, CORRELATION, SEQUENCE_ANALYSIS)")
    message: str = Field(..., description="Human-readable progress description")
    timestamp: str = Field(..., description="ISO timestamp of activity step")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Optional stage metadata")


class InvestigationRequest(BaseModel):
    """
    Request payload containing chronologically sequenced timeline events to investigate.
    """
    events: List[TimelineEvent] = Field(
        ...,
        description="List of timeline events to analyze",
    )


class InvestigationResponse(BaseModel):
    """
    Structured response containing verified findings, pipeline activities,
    and transparent verdict.
    """
    verdict: InvestigationVerdict = Field(..., description="High-level investigation verdict")
    verdict_explanation: str = Field(..., description="Transparent explanation for the assigned verdict")
    total_events_analyzed: int = Field(..., description="Total timeline events evaluated", ge=0)
    findings_count: int = Field(..., description="Number of analyst-visible high-confidence findings", ge=0)
    low_confidence_excluded_count: int = Field(
        ...,
        description="Count of low-confidence indicators retained internally for correlation but excluded from final findings",
        ge=0,
    )
    findings: List[InvestigationFinding] = Field(
        default_factory=list,
        description="Analyst-visible high-confidence findings",
    )
    activities: List[InvestigationActivity] = Field(
        default_factory=list,
        description="Chronological pipeline execution activity events",
    )
    analysis_method: str = Field(
        default="rule_based",
        description="Labelled analysis methodology (rule_based deterministic analysis)",
    )


class InvestigationErrorResponse(BaseModel):
    """
    Client-safe error response model.
    """
    detail: str = Field(..., description="Human-readable error description")
    error_code: str = Field(..., description="Machine-readable error identifier")
