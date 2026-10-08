import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_timeline_analyze_success(client: TestClient):
    payload = {
        "events": [
            {
                "event_index": 1,
                "source_line_number": 4,
                "event_time": "Oct 06 08:35:10",
                "raw_message": "Oct 06 08:35:10 srv-corp-lnx01 sshd[2104]: Failed password for invalid user admin from 192.168.1.105 port 43210 ssh2",
            },
            {
                "event_index": 2,
                "source_line_number": 11,
                "event_time": "Oct 06 08:43:02",
                "raw_message": "Oct 06 08:43:02 srv-corp-lnx01 sudo[2189]: sec_analyst : TTY=pts/0 ; PWD=/home/sec_analyst ; USER=root ; COMMAND=/usr/bin/id",
            },
        ]
    }

    resp = client.post("/api/v1/timeline/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["event_count"] == 2
    assert data["suspicious_count"] >= 1
    assert data["classification_method"] == "rule_based"
    assert len(data["timeline"]) == 2
    assert data["timeline"][0]["event_id"] == "timeline-evt-001"
    assert data["timeline"][0]["original_event_index"] == 1
    assert data["timeline"][1]["event_id"] == "timeline-evt-002"
    assert data["timeline"][1]["original_event_index"] == 2


def test_timeline_analyze_empty_events_error(client: TestClient):
    resp = client.post("/api/v1/timeline/analyze", json={"events": []})
    assert resp.status_code == 400
    assert "empty event list" in resp.json()["detail"].lower()


def test_timeline_analyze_missing_body(client: TestClient):
    resp = client.post("/api/v1/timeline/analyze", json={})
    assert resp.status_code == 422


def test_timeline_sample_scenario(client: TestClient):
    resp = client.post(
        "/api/v1/timeline/sample",
        json={"sample_name": "sample-privilege-escalation.log"},
    )
    assert resp.status_code == 200
    data = resp.json()

    # Verified 30 events in sample-privilege-escalation.log
    assert data["event_count"] == 30
    assert data["suspicious_count"] > 0
    assert "AUTHENTICATION" in data["stages_detected"]
    assert "PRIVILEGE_ESCALATION" in data["stages_detected"]
    assert "EXECUTION" in data["stages_detected"]
    assert "POST_EXPLOITATION" in data["stages_detected"]
    assert len(data["timeline"]) == 30
