import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.evidence import SampleEvidenceRequest
from backend.app.schemas.timeline import (
    TimelineRequest,
    TimelineResponse,
)
from backend.app.services.evidence.exceptions import EvidenceException
from backend.app.services.evidence.service import EvidenceService
from backend.app.services.timeline.service import TimelineService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.post(
    "/analyze",
    response_model=TimelineResponse,
    status_code=status.HTTP_200_OK,
    summary="Construct investigation timeline from normalized events",
    description="Accepts normalized Linux candidate events, sequences them chronologically, classifies attack stages, and identifies suspicious behaviors.",
)
async def analyze_timeline(
    payload: TimelineRequest,
) -> TimelineResponse:
    if not payload.events:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot construct investigation timeline from an empty event list. Please ingest log evidence first.",
        )
    try:
        return TimelineService.build_timeline(candidate_events=payload.events)
    except Exception as exc:
        logger.error("Unexpected error constructing timeline: %s", exc, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal error occurred while generating the investigation timeline.",
        ) from None


@router.post(
    "/sample",
    response_model=TimelineResponse,
    status_code=status.HTTP_200_OK,
    summary="Construct timeline for sample Linux security scenario",
    description="Loads pre-packaged sample scenario and constructs the chronological investigation timeline.",
)
async def analyze_sample_timeline(
    payload: Optional[SampleEvidenceRequest] = None,
) -> TimelineResponse:
    try:
        sample_name = payload.sample_name if payload and payload.sample_name else "sample-privilege-escalation.log"
        evidence_resp = EvidenceService.process_sample_scenario(sample_name=sample_name)
        return TimelineService.build_timeline(candidate_events=evidence_resp.normalized_events)
    except EvidenceException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from None
    except Exception as exc:
        logger.error("Unexpected error constructing sample timeline: %s", exc, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal error occurred while generating the sample timeline.",
        ) from None
