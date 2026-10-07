import {
  HealthStatus,
  EvidenceResponse,
} from '../types';

/**
 * Backend API Base URL configurable via environment variable VITE_API_URL.
 * Defaults to http://localhost:8000 in local development.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:8000';

/**
 * Helper to parse backend error responses cleanly without leaking internal traces.
 */
async function parseErrorResponse(response: Response): Promise<string> {
  let fallbackMessage = `Request failed (${response.status}: ${response.statusText || 'Error'})`;
  try {
    const errorJson = await response.json();
    if (errorJson && errorJson.detail) {
      if (typeof errorJson.detail === 'string') {
        return errorJson.detail;
      }
      if (Array.isArray(errorJson.detail)) {
        return errorJson.detail.map((item: { msg?: string }) => item.msg || 'Validation error').join(', ');
      }
      return JSON.stringify(errorJson.detail);
    }
  } catch {
    // Non-JSON error body
  }
  return fallbackMessage;
}

/**
 * Check backend health status via GET /health endpoint.
 */
export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const msg = await parseErrorResponse(response);
      throw new Error(msg);
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Backend service is unreachable at ${API_BASE_URL}. Verify backend server is running.`);
    }
    throw error;
  }
}

/**
 * Ingest pasted raw Linux log text.
 * Calls POST /api/v1/evidence/paste.
 */
export async function pasteEvidence(
  content: string,
  filename?: string
): Promise<EvidenceResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/evidence/paste`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        content,
        filename: filename?.trim() || undefined,
      }),
    });

    if (!response.ok) {
      const msg = await parseErrorResponse(response);
      throw new Error(msg);
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Backend service is unreachable at ${API_BASE_URL}. Verify backend server is running.`);
    }
    throw error;
  }
}

/**
 * Upload a .log or .txt evidence file.
 * Calls POST /api/v1/evidence/upload via multipart/form-data.
 */
export async function uploadEvidence(file: File): Promise<EvidenceResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/v1/evidence/upload`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const msg = await parseErrorResponse(response);
      throw new Error(msg);
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Backend service is unreachable at ${API_BASE_URL}. Verify backend server is running.`);
    }
    throw error;
  }
}

/**
 * Load a pre-packaged sample Linux security log scenario.
 * Calls POST /api/v1/evidence/sample.
 */
export async function loadSampleEvidence(
  sampleName: string = 'sample-privilege-escalation.log'
): Promise<EvidenceResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/evidence/sample`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sample_name: sampleName,
      }),
    });

    if (!response.ok) {
      const msg = await parseErrorResponse(response);
      throw new Error(msg);
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Backend service is unreachable at ${API_BASE_URL}. Verify backend server is running.`);
    }
    throw error;
  }
}

/**
 * Fetch available sample scenarios.
 * Calls GET /api/v1/evidence/samples.
 */
export async function listSamples(): Promise<{ samples: string[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/evidence/samples`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const msg = await parseErrorResponse(response);
      throw new Error(msg);
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Backend service is unreachable at ${API_BASE_URL}. Verify backend server is running.`);
    }
    throw error;
  }
}
