import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    """
    Test GET /health returns status 200 and {'status': 'ok'}.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_v1_health_endpoint():
    """
    Test GET /api/v1/health returns status 200 and {'status': 'ok'}.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_endpoint():
    """
    Test GET / returns operational info.
    """
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "AI-Powered Linux Malware" in data["name"]


@pytest.mark.asyncio
async def test_async_health_endpoint():
    """
    Test GET /health using httpx AsyncClient.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_headers_for_allowed_origins():
    """
    Test CORS preflight response for allowed origins including Render production frontend.
    """
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://ai-linux-investigation-frontend.onrender.com",
    ]
    for origin in allowed_origins:
        headers = {
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        }
        response = client.options("/health", headers=headers)
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == origin
        assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_headers_for_disallowed_origin():
    """
    Test CORS preflight does not allow untrusted origins.
    """
    headers = {
        "Origin": "https://malicious-site.com",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/health", headers=headers)
    assert response.headers.get("access-control-allow-origin") is None
