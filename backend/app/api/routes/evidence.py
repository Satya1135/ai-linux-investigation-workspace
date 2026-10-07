"""
Evidence Intake API Routes.

Provides endpoints for ingesting Linux log evidence via:
1. Pasted text (POST /api/v1/evidence/paste)
2. File upload of .log / .txt (POST /api/v1/evidence/upload)
3. Pre-packaged sample scenario (POST /api/v1/evidence/sample)
4. List available samples (GET /api/v1/evidence/samples)
"""

import logging
from typing import Optional
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from backend.app.schemas.evidence import (
    EvidenceResponse,
    PastedEvidenceRequest,
    SampleEvidenceRequest,
)
from backend.app.services.evidence.exceptions import EvidenceException
from backend.app.services.evidence.service import EvidenceService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.post(
    "/paste",
    response_model=EvidenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest pasted Linux log evidence",
    description="Accepts raw pasted text, validates size/content, normalizes line endings, and preserves original evidence.",
)
async def intake_pasted_evidence(
    payload: PastedEvidenceRequest,
) -> EvidenceResponse:
    try:
        return EvidenceService.process_pasted_evidence(
            content=payload.content,
            filename=payload.filename,
        )
    except EvidenceException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from None
    except Exception as exc:
        logger.error("Unexpected error during pasted evidence intake: %s", exc, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal error occurred during evidence intake.",
        ) from None


@router.post(
    "/upload",
    response_model=EvidenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest uploaded .log or .txt file",
    description="Accepts multipart/form-data upload of .log or .txt files up to 5 MB, enforces strict extension validation.",
)
async def intake_uploaded_file(
    file: UploadFile = File(..., description="Uploaded .log or .txt evidence file"),
) -> EvidenceResponse:
    try:
        raw_bytes = await file.read()
        return EvidenceService.process_uploaded_file(
            filename=file.filename or "",
            raw_bytes=raw_bytes,
        )
    except EvidenceException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from None
    except Exception as exc:
        logger.error("Unexpected error during file upload intake: %s", exc, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal error occurred during evidence intake.",
        ) from None


@router.post(
    "/sample",
    response_model=EvidenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Load sample Linux security scenario",
    description="Loads a verified pre-packaged synthetic scenario from sample-data/linux/.",
)
async def intake_sample_scenario(
    payload: Optional[SampleEvidenceRequest] = None,
) -> EvidenceResponse:
    try:
        sample_name = payload.sample_name if payload and payload.sample_name else "sample-privilege-escalation.log"
        return EvidenceService.process_sample_scenario(sample_name=sample_name)
    except EvidenceException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from None
    except Exception as exc:
        logger.error("Unexpected error during sample scenario intake: %s", exc, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal error occurred during evidence intake.",
        ) from None


@router.get(
    "/samples",
    summary="List available sample scenarios",
    description="Returns filenames of available pre-packaged sample scenarios.",
)
async def list_sample_scenarios():
    try:
        samples = EvidenceService.list_available_samples()
        return {"samples": samples}
    except Exception as exc:
        logger.error("Unexpected error listing samples: %s", exc, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve available sample scenarios.",
        ) from None
