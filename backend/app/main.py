from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.evidence import router as evidence_router
from backend.app.api.routes.timeline import router as timeline_router
from backend.app.services.evidence.exceptions import EvidenceException
from fastapi.responses import JSONResponse

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Exception handler for evidence domain exceptions
@app.exception_handler(EvidenceException)
async def evidence_exception_handler(request, exc: EvidenceException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "error_code": exc.error_code},
    )

# Configure CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Health router mounted at root for GET /health
app.include_router(health_router)

# Also mount under API prefix for consistency
app.include_router(health_router, prefix=settings.API_V1_STR)

# Mount evidence intake routes under /api/v1
app.include_router(evidence_router, prefix=settings.API_V1_STR)

# Mount timeline investigation routes under /api/v1
app.include_router(timeline_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["root"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "0.1.0",
        "status": "operational",
        "docs": "/docs",
    }
