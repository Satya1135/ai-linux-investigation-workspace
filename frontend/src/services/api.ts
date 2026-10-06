import { HealthStatus } from '../types';

/**
 * Backend API Base URL configurable via environment variable VITE_API_URL.
 * Defaults to http://localhost:8000 in local development.
 */
export const API_BASE_URL: string = 
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:8000';

/**
 * Check backend health status via GET /health endpoint.
 */
export async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API health check failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
