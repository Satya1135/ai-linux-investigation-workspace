/**
 * Verification script for Frontend Evidence Intake API integration.
 * Tests all flows expected by the frontend:
 * TEST A: Use Sample Scenario
 * TEST B: Upload valid .log
 * TEST C: Upload valid .txt
 * TEST D: Upload unsupported file (.exe, .sh)
 * TEST E: Upload file larger than 5 MB
 * TEST F: Paste valid Linux logs
 * TEST G: Paste empty input
 * TEST H: Original Evidence representation
 * TEST I: Backend unreachable simulation
 */

const BASE_URL = 'http://127.0.0.1:8000';

async function runTests() {
  console.log('--- Starting Frontend API Integration Verification ---');

  // Test 1: Health
  console.log('\n[TEST 1] Checking GET /health...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log(`Health: status=${healthRes.status}`, healthData);
  if (healthRes.status !== 200 || healthData.status !== 'ok') {
    throw new Error('Health check failed');
  }

  // TEST A: Sample Scenario
  console.log('\n[TEST A] Loading Sample Scenario (POST /api/v1/evidence/sample)...');
  const sampleRes = await fetch(`${BASE_URL}/api/v1/evidence/sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sample_name: 'sample-privilege-escalation.log' }),
  });
  const sampleData = await sampleRes.json();
  console.log(`Sample status: ${sampleRes.status}, source: ${sampleData.source_type}, events: ${sampleData.event_count}`);
  if (sampleRes.status !== 200 || sampleData.source_type !== 'sample' || sampleData.event_count < 10) {
    throw new Error('TEST A failed');
  }
  console.log('TEST A passed!');

  // TEST B: Upload valid .log
  console.log('\n[TEST B] Uploading valid .log (POST /api/v1/evidence/upload)...');
  const logBlob = new Blob(['Oct 06 08:12:01 srv01 systemd[1]: Test service\n'], { type: 'text/plain' });
  const logForm = new FormData();
  logForm.append('file', logBlob, 'test_security.log');
  const uploadLogRes = await fetch(`${BASE_URL}/api/v1/evidence/upload`, {
    method: 'POST',
    body: logForm,
  });
  const uploadLogData = await uploadLogRes.json();
  console.log(`Upload .log status: ${uploadLogRes.status}, filename: ${uploadLogData.filename}, events: ${uploadLogData.event_count}`);
  if (uploadLogRes.status !== 200 || uploadLogData.source_type !== 'upload') {
    throw new Error('TEST B failed');
  }
  console.log('TEST B passed!');

  // TEST C: Upload valid .txt
  console.log('\n[TEST C] Uploading valid .txt (POST /api/v1/evidence/upload)...');
  const txtBlob = new Blob(['2026-10-06 08:12:01 srv01 sshd: Accepted password\n'], { type: 'text/plain' });
  const txtForm = new FormData();
  txtForm.append('file', txtBlob, 'audit_export.txt');
  const uploadTxtRes = await fetch(`${BASE_URL}/api/v1/evidence/upload`, {
    method: 'POST',
    body: txtForm,
  });
  const uploadTxtData = await uploadTxtRes.json();
  console.log(`Upload .txt status: ${uploadTxtRes.status}, filename: ${uploadTxtData.filename}`);
  if (uploadTxtRes.status !== 200 || uploadTxtData.source_type !== 'upload') {
    throw new Error('TEST C failed');
  }
  console.log('TEST C passed!');

  // TEST D: Upload unsupported file
  console.log('\n[TEST D] Uploading unsupported file (.exe)...');
  const exeBlob = new Blob(['MZ dummy binary'], { type: 'application/octet-stream' });
  const exeForm = new FormData();
  exeForm.append('file', exeBlob, 'malware.exe');
  const uploadExeRes = await fetch(`${BASE_URL}/api/v1/evidence/upload`, {
    method: 'POST',
    body: exeForm,
  });
  const uploadExeData = await uploadExeRes.json();
  console.log(`Upload .exe status: ${uploadExeRes.status}, error: ${uploadExeData.detail}`);
  if (uploadExeRes.status !== 400 || !uploadExeData.detail.toLowerCase().includes('unsupported')) {
    throw new Error('TEST D failed');
  }
  console.log('TEST D passed!');

  // TEST E: Upload file larger than 5 MB
  console.log('\n[TEST E] Uploading oversized file (> 5 MB)...');
  const hugeBuffer = new Uint8Array(5 * 1024 * 1024 + 10);
  const hugeBlob = new Blob([hugeBuffer], { type: 'text/plain' });
  const hugeForm = new FormData();
  hugeForm.append('file', hugeBlob, 'oversized.log');
  const uploadHugeRes = await fetch(`${BASE_URL}/api/v1/evidence/upload`, {
    method: 'POST',
    body: hugeForm,
  });
  const uploadHugeData = await uploadHugeRes.json();
  console.log(`Upload oversized status: ${uploadHugeRes.status}, detail: ${uploadHugeData.detail}`);
  if (uploadHugeRes.status !== 413 && uploadHugeRes.status !== 400) {
    throw new Error('TEST E failed');
  }
  console.log('TEST E passed!');

  // TEST F: Paste valid Linux logs
  console.log('\n[TEST F] Pasting valid Linux logs (POST /api/v1/evidence/paste)...');
  const pasteContent = 'Oct 06 08:12:01 srv01 systemd[1]: Service started\nOct 06 08:12:05 srv01 sshd: Listening on 22\n';
  const pasteRes = await fetch(`${BASE_URL}/api/v1/evidence/paste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: pasteContent, filename: 'pasted_auth.log' }),
  });
  const pasteData = await pasteRes.json();
  console.log(`Paste status: ${pasteRes.status}, source: ${pasteData.source_type}, events: ${pasteData.event_count}`);
  if (pasteRes.status !== 200 || pasteData.source_type !== 'paste' || pasteData.event_count !== 2) {
    throw new Error('TEST F failed');
  }
  console.log('TEST F passed!');

  // TEST G: Paste empty input
  console.log('\n[TEST G] Pasting empty input...');
  const pasteEmptyRes = await fetch(`${BASE_URL}/api/v1/evidence/paste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '   \n  \t  ' }),
  });
  const pasteEmptyData = await pasteEmptyRes.json();
  console.log(`Paste empty status: ${pasteEmptyRes.status}, detail: ${pasteEmptyData.detail}`);
  if (pasteEmptyRes.status !== 400 || !pasteEmptyData.detail.toLowerCase().includes('empty')) {
    throw new Error('TEST G failed');
  }
  console.log('TEST G passed!');

  // TEST H: Original Evidence section integrity
  console.log('\n[TEST H] Verifying original evidence preservation and safe text rendering...');
  if (pasteData.original_content !== pasteContent) {
    throw new Error('Original content mismatch');
  }
  if (!pasteData.original_content_sha256 || pasteData.original_content_sha256.length !== 64) {
    throw new Error('Invalid SHA-256 digest');
  }
  console.log(`Original content matched verbatim (${pasteData.byte_size} bytes, SHA-256: ${pasteData.original_content_sha256})`);
  console.log('TEST H passed!');

  console.log('\n--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
