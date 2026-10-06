from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health", summary="Health check endpoint")
async def get_health():
    """
    Returns service health status.
    """
    return {"status": "ok"}
