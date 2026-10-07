"""
Integration tests for Evidence Intake API endpoints (/api/v1/evidence/*).

Covers:
- POST /api/v1/evidence/paste (valid, empty, oversized)
- POST /api/v1/evidence/upload (valid .log, valid .txt, empty, unsupported ext, oversized, binary)
- POST /api/v1/evidence/sample (default sample, specific sample, missing sample)
- GET /api/v1/evidence/samples (listing available samples)
"""

import io
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.evidence.service import MAX_EVIDENCE_SIZE_BYTES

client = TestClient(app)


def test_valid_pasted_linux_logs():
    """
    Test 1: Valid pasted Linux logs intake.
    """
    payload = {
        "content": (
            "Oct 06 08:12:01 srv01 systemd[1]: Starting service...\n"
            "Oct 06 08:12:05 srv01 systemd[1]: Service started.\n"
        ),
        "filename": "pasted_auth.log",
        "description": "Captured incident telemetry",
    }
    response = client.post("/api/v1/evidence/paste", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["source_type"] == "paste"
    assert data["filename"] == "pasted_auth.log"
    assert data["event_count"] == 2
    assert data["validation_status"] == "valid"
    assert len(data["normalized_events"]) == 2
    assert data["normalized_events"][0]["event_index"] == 1
    assert data["normalized_events"][0]["source_line_number"] == 1
    assert data["normalized_events"][0]["event_time"] == "Oct 06 08:12:01"
    assert "systemd[1]: Starting service..." in data["normalized_events"][0]["raw_message"]
    assert "evidence_id" in data
    assert "original_content_sha256" in data
    assert "sha256_hash" in data


def test_valid_log_upload():
    """
    Test 2: Valid .log upload.
    """
    file_content = (
        b"Oct 06 08:35:10 srv01 sshd[2104]: Failed password for root from 192.168.1.105 port 43210 ssh2\n"
        b"Oct 06 08:35:15 srv01 sshd[2106]: Failed password for admin from 192.168.1.105 port 43212 ssh2\n"
    )
    files = {"file": ("auth_audit.log", io.BytesIO(file_content), "text/plain")}
    response = client.post("/api/v1/evidence/upload", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "upload"
    assert data["filename"] == "auth_audit.log"
    assert data["event_count"] == 2
    assert data["validation_status"] == "valid"
    assert len(data["original_content_sha256"]) == 64


def test_valid_txt_upload():
    """
    Test 3: Valid .txt upload.
    """
    file_content = (
        b"2026-10-06 08:42:15 srv01 sshd: Accepted password for sec_analyst\n"
        b"2026-10-06 08:43:02 srv01 sudo: sec_analyst : COMMAND=/usr/bin/id\n"
    )
    files = {"file": ("syslog_export.txt", io.BytesIO(file_content), "text/plain")}
    response = client.post("/api/v1/evidence/upload", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "upload"
    assert data["filename"] == "syslog_export.txt"
    assert data["event_count"] == 2
    assert data["validation_status"] == "valid"


def test_sample_scenario_intake():
    """
    Test 4: Sample scenario intake.
    """
    response = client.post("/api/v1/evidence/sample", json={"sample_name": "sample-privilege-escalation.log"})
    assert response.status_code == 200
    data = response.json()

    assert data["source_type"] == "sample"
    assert data["filename"] == "sample-privilege-escalation.log"
    assert data["event_count"] > 10
    assert data["validation_status"] == "valid"
    assert "find" in data["original_content"]


def test_sample_scenario_default_payload():
    """
    Verify sample endpoint with empty body loads default privilege escalation scenario.
    """
    response = client.post("/api/v1/evidence/sample", json={})
    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "sample"
    assert data["filename"] == "sample-privilege-escalation.log"


def test_list_samples_endpoint():
    """
    Verify GET /api/v1/evidence/samples lists available samples.
    """
    response = client.get("/api/v1/evidence/samples")
    assert response.status_code == 200
    data = response.json()
    assert "samples" in data
    assert "sample-privilege-escalation.log" in data["samples"]


def test_empty_pasted_input_rejected():
    """
    Test 5: Empty and whitespace-only pasted input rejected with 400.
    """
    res1 = client.post("/api/v1/evidence/paste", json={"content": ""})
    assert res1.status_code == 400
    assert "empty" in res1.json()["detail"].lower()

    res2 = client.post("/api/v1/evidence/paste", json={"content": "   \n\t   "})
    assert res2.status_code == 400
    assert "empty" in res2.json()["detail"].lower()


def test_empty_uploaded_file_rejected():
    """
    Test 6: Empty uploaded file rejected with 400.
    """
    files = {"file": ("empty.log", io.BytesIO(b""), "text/plain")}
    response = client.post("/api/v1/evidence/upload", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_unsupported_extensions_rejected():
    """
    Test 7: Unsupported file extensions (.exe, .sh, .py, etc.) rejected with 400.
    """
    disallowed = ["malware.exe", "attack.sh", "exploit.py", "script.bat", "archive.zip"]
    for fname in disallowed:
        files = {"file": (fname, io.BytesIO(b"log content\n"), "application/octet-stream")}
        response = client.post("/api/v1/evidence/upload", files=files)
        assert response.status_code == 400
        assert "unsupported" in response.json()["detail"].lower()


def test_oversized_upload_rejected():
    """
    Test 8: Oversized upload exceeding 5 MB rejected with 413.
    """
    oversized_data = b"X" * (MAX_EVIDENCE_SIZE_BYTES + 10)
    files = {"file": ("huge.log", io.BytesIO(oversized_data), "text/plain")}
    response = client.post("/api/v1/evidence/upload", files=files)
    assert response.status_code == 413
    assert "5 mb" in response.json()["detail"].lower()


def test_binary_upload_rejected():
    """
    Binary file (null bytes) uploaded as .log rejected with 400.
    """
    binary_data = b"\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    files = {"file": ("fake_binary.log", io.BytesIO(binary_data), "application/octet-stream")}
    response = client.post("/api/v1/evidence/upload", files=files)
    assert response.status_code == 400
    assert "binary" in response.json()["detail"].lower()


def test_missing_sample_rejected():
    """
    Request for non-existent sample scenario returns 404.
    """
    response = client.post(
        "/api/v1/evidence/sample",
        json={"sample_name": "non_existent.log"},
    )
    assert response.status_code == 404
    assert "not exist" in response.json()["detail"].lower()
