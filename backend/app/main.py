from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.routes.health import router as health_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
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


@app.get("/", tags=["root"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "0.1.0",
        "status": "operational",
        "docs": "/docs",
    }
