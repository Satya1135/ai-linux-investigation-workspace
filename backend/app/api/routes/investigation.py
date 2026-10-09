import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.evidence import SampleEvidenceRequest
from backend.app.schemas.investigation import (
    InvestigationRequest,
    InvestigationResponse,
)
from backend.app.services.evidence.exceptions import EvidenceException
from backend.app.services.evidence.service import EvidenceService
from backend.app.services.investigation.exceptions import InvestigationException
from backend.app.services.investigation.service import InvestigationService
from backend.app.services.timeline.service import TimelineService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/investigation", tags=["investigation"])


@router.post(
    "/analyze",
    response_model=InvestigationResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute defensive investigation pipeline on timeline events",
    description=(
        "Accepts chronologically sequenced timeline events, executes deterministic multi-stage correlation, "
        "calculates grounded confidence scores, filters low-confidence noise, and returns structured findings "
        "with evidence provenance and transparent verdict."
    ),
)
async def analyze_investigation(
    payload: InvestigationRequest,
) -> InvestigationResponse:
    if not payload.events:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot run investigation on empty timeline events. Please submit at least one timeline event.",
        )
    try:
        return InvestigationService.run_investigation(events=payload.events)
    except InvestigationException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from None
    except Exception as exc:
        logger.error("Unexpected error in investigation pipeline: %s", exc, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal error occurred while executing the investigation pipeline.",
        ) from None


@router.post(
    "/sample",
    response_model=InvestigationResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute defensive investigation on sample scenario",
    description=(
        "Loads pre-packaged Linux security log scenario, builds chronological timeline, and executes "
        "defensive investigation pipeline to produce structured findings."
    ),
)
async def analyze_sample_investigation(
    payload: Optional[SampleEvidenceRequest] = None,
) -> InvestigationResponse:
    try:
        sample_name = (
            payload.sample_name if payload and payload.sample_name else "sample-privilege-escalation.log"
        )
        evidence_resp = EvidenceService.process_sample_scenario(sample_name=sample_name)
        timeline_resp = TimelineService.build_timeline(candidate_events=evidence_resp.normalized_events)
        return InvestigationService.run_investigation(events=timeline_resp.timeline)
    except (EvidenceException, InvestigationException) as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from None
    except Exception as exc:
        logger.error("Unexpected error in sample investigation: %s", exc, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal error occurred while analyzing the sample scenario.",
        ) from None
