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
