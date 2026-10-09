import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_investigation_analyze_success(client: TestClient):
    payload = {
        "events": [
            {
                "event_id": "evt-001",
                "timestamp": "Oct 06 08:35:10",
                "host": "srv01",
                "process": "sshd",
                "event_type": "AUTH_FAIL",
                "message": "Failed password for invalid user admin from 192.168.1.105",
                "raw_message": "Oct 06 08:35:10 srv01 sshd[2104]: Failed password for invalid user admin from 192.168.1.105 port 43210 ssh2",
                "original_event_index": 1,
                "source_line_start": 4,
                "source_line_end": 4,
                "suspicious": True,
                "severity": "LOW",
                "attack_stage": "AUTHENTICATION",
                "highlight_reason": "SSH authentication failure",
                "classification_method": "rule_based",
            },
            {
                "event_id": "evt-002",
                "timestamp": "Oct 06 08:35:15",
                "host": "srv01",
                "process": "sshd",
                "event_type": "AUTH_FAIL",
                "message": "Failed password for invalid user root from 192.168.1.105",
                "raw_message": "Oct 06 08:35:15 srv01 sshd[2106]: Failed password for invalid user root from 192.168.1.105 port 43212 ssh2",
                "original_event_index": 2,
                "source_line_start": 5,
                "source_line_end": 5,
                "suspicious": True,
                "severity": "LOW",
                "attack_stage": "AUTHENTICATION",
                "highlight_reason": "SSH authentication failure",
                "classification_method": "rule_based",
            },
            {
                "event_id": "evt-003",
                "timestamp": "Oct 06 08:42:15",
                "host": "srv01",
                "process": "sshd",
                "event_type": "AUTH_SUCCESS",
                "message": "Accepted password for sec_analyst from 192.168.1.105",
                "raw_message": "Oct 06 08:42:15 srv01 sshd[2150]: Accepted password for sec_analyst from 192.168.1.105 port 43220 ssh2",
                "original_event_index": 3,
                "source_line_start": 8,
                "source_line_end": 8,
                "suspicious": False,
                "severity": "INFO",
                "attack_stage": "AUTHENTICATION",
                "highlight_reason": None,
                "classification_method": "rule_based",
            },
        ]
    }

    resp = client.post("/api/v1/investigation/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["verdict"] == "SUSPICIOUS_ACTIVITY_DETECTED"
    assert data["total_events_analyzed"] == 3
    assert data["findings_count"] >= 1
    assert data["analysis_method"] == "rule_based"
    assert len(data["activities"]) == 5

    finding = data["findings"][0]
    assert finding["category"] == "AUTHENTICATION_ANOMALY"
    assert finding["confidence_score"] >= 0.85
    assert finding["supporting_events"] == ["evt-001", "evt-002", "evt-003"]
    assert finding["original_event_indexes"] == [1, 2, 3]
    assert "srv01" in finding["hosts"]
    assert finding["recommended_next_step"] is not None


def test_investigation_analyze_empty_events_error(client: TestClient):
    resp = client.post("/api/v1/investigation/analyze", json={"events": []})
    assert resp.status_code == 400
    assert "empty timeline events" in resp.json()["detail"].lower()


def test_investigation_analyze_missing_body(client: TestClient):
    resp = client.post("/api/v1/investigation/analyze", json={})
    assert resp.status_code == 422


def test_investigation_sample_scenario(client: TestClient):
    resp = client.post(
        "/api/v1/investigation/sample",
        json={"sample_name": "sample-privilege-escalation.log"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["verdict"] == "SUSPICIOUS_ACTIVITY_DETECTED"
    assert data["total_events_analyzed"] == 30
    assert data["findings_count"] >= 5
    assert data["analysis_method"] == "rule_based"

    # Verify structured activity stages
    steps = [a["step"] for a in data["activities"]]
    assert steps == [
        "VALIDATION",
        "CORRELATION",
        "SEQUENCE_ANALYSIS",
        "CONFIDENCE_ASSESSMENT",
        "RESULT_PREPARATION",
    ]

    # Verify finding contract fields
    for f in data["findings"]:
        assert "finding_id" in f
        assert "title" in f
        assert "severity" in f
        assert "category" in f
        assert "explanation" in f
        assert "supporting_events" in f
        assert "original_event_indexes" in f
        assert "confidence_score" in f
        assert "recommended_next_step" in f
        assert 0.0 <= f["confidence_score"] <= 1.0


def test_investigation_sample_not_found(client: TestClient):
    resp = client.post(
        "/api/v1/investigation/sample",
        json={"sample_name": "nonexistent-sample.log"},
    )
    assert resp.status_code == 404


def test_investigation_analyze_insufficient_evidence(client: TestClient):
    payload = {
        "events": [
            {
                "event_id": "evt-001",
                "timestamp": "Oct 06 08:12:01",
                "host": "srv01",
                "process": "systemd",
                "event_type": "SYSTEM",
                "message": "Starting Daily apt download activities...",
                "raw_message": "Oct 06 08:12:01 srv01 systemd[1]: Starting Daily apt download activities...",
                "original_event_index": 1,
                "source_line_start": 1,
                "source_line_end": 1,
                "suspicious": False,
                "severity": "INFO",
                "attack_stage": "OTHER",
                "highlight_reason": None,
                "classification_method": "rule_based",
            }
        ]
    }
    resp = client.post("/api/v1/investigation/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "INSUFFICIENT_EVIDENCE"
    assert data["findings_count"] == 0
    assert data["low_confidence_excluded_count"] == 0
    assert "insufficient evidence" in data["verdict_explanation"].lower()


def test_investigation_analyze_no_high_confidence_benign_system(client: TestClient):
    payload = {
        "events": [
            {
                "event_id": f"evt-{i:03d}",
                "timestamp": f"Oct 06 08:12:{i:02d}",
                "host": "srv01",
                "process": "systemd",
                "event_type": "SYSTEM",
                "message": f"Routine systemd status {i}",
                "raw_message": f"Oct 06 08:12:{i:02d} srv01 systemd[1]: Routine systemd status {i}",
                "original_event_index": i,
                "source_line_start": i,
                "source_line_end": i,
                "suspicious": False,
                "severity": "INFO",
                "attack_stage": "OTHER",
                "highlight_reason": None,
                "classification_method": "rule_based",
            }
            for i in range(1, 5)
        ]
    }
    resp = client.post("/api/v1/investigation/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "NO_HIGH_CONFIDENCE_FINDINGS"
    assert data["findings_count"] == 0
    assert data["low_confidence_excluded_count"] == 0
    assert "routine operational activity" in data["verdict_explanation"].lower()


def test_investigation_analyze_isolated_noise_suppression(client: TestClient):
    payload = {
        "events": [
            {
                "event_id": "evt-001",
                "timestamp": "Oct 06 08:35:10",
                "host": "srv01",
                "process": "sshd",
                "event_type": "AUTH_FAIL",
                "message": "Failed password for invalid user admin",
                "raw_message": "Oct 06 08:35:10 srv01 sshd[2104]: Failed password for invalid user admin from 192.168.1.105 port 43210 ssh2",
                "original_event_index": 1,
                "source_line_start": 4,
                "source_line_end": 4,
                "suspicious": True,
                "severity": "LOW",
                "attack_stage": "AUTHENTICATION",
                "highlight_reason": "SSH authentication failure",
                "classification_method": "rule_based",
            },
            {
                "event_id": "evt-002",
                "timestamp": "Oct 06 08:36:00",
                "host": "srv01",
                "process": "systemd",
                "event_type": "SYSTEM",
                "message": "Routine status ok",
                "raw_message": "Oct 06 08:36:00 srv01 systemd[1]: Routine status ok",
                "original_event_index": 2,
                "source_line_start": 5,
                "source_line_end": 5,
                "suspicious": False,
                "severity": "INFO",
                "attack_stage": "OTHER",
                "highlight_reason": None,
                "classification_method": "rule_based",
            },
            {
                "event_id": "evt-003",
                "timestamp": "Oct 06 08:37:00",
                "host": "srv01",
                "process": "systemd",
                "event_type": "SYSTEM",
                "message": "Routine status ok",
                "raw_message": "Oct 06 08:37:00 srv01 systemd[1]: Routine status ok",
                "original_event_index": 3,
                "source_line_start": 6,
                "source_line_end": 6,
                "suspicious": False,
                "severity": "INFO",
                "attack_stage": "OTHER",
                "highlight_reason": None,
                "classification_method": "rule_based",
            },
        ]
    }
    resp = client.post("/api/v1/investigation/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "NO_HIGH_CONFIDENCE_FINDINGS"
    assert data["findings_count"] == 0
    assert data["low_confidence_excluded_count"] == 1
    assert "low-confidence indicator" in data["verdict_explanation"].lower()


def test_investigation_analyze_oversized_payload(client: TestClient):
    payload = {
        "events": [
            {
                "event_id": f"evt-{i:04d}",
                "timestamp": "Oct 06 08:12:00",
                "host": "srv01",
                "process": "systemd",
                "event_type": "SYSTEM",
                "message": f"Event {i}",
                "raw_message": f"Oct 06 08:12:00 srv01 systemd[1]: Event {i}",
                "original_event_index": i,
                "source_line_start": i,
                "source_line_end": i,
                "suspicious": False,
                "severity": "INFO",
                "attack_stage": "OTHER",
                "highlight_reason": None,
                "classification_method": "rule_based",
            }
            for i in range(1, 2005)
        ]
    }
    resp = client.post("/api/v1/investigation/analyze", json=payload)
    assert resp.status_code == 400
    assert "exceeds maximum allowed limit" in resp.json()["detail"].lower()

