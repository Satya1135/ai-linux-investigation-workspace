export type NavSection = 'dashboard' | 'cases' | 'evidence' | 'investigation' | 'reports' | 'settings';

export interface HealthStatus {
  status: string;
  name?: string;
  version?: string;
  timestamp?: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  targetHost: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TRIAGE' | 'ANALYSIS' | 'CONTAINED' | 'CLOSED';
  detectedAt: string;
  indicatorCount: number;
}

/**
 * Evidence intake source classification.
 */
export type EvidenceSourceType = 'sample' | 'upload' | 'paste';

/**
 * Structured candidate log event safely extracted without code execution.
 */
export interface LogEventCandidate {
  event_index: number;
  source_line_number: number;
  event_time: string | null;
  raw_message: string;
}

/**
 * Metadata representation of ingested evidence.
 */
export interface EvidenceMetadata {
  evidence_id: string;
  source_type: EvidenceSourceType;
  filename: string | null;
  byte_size: number;
  original_content_sha256: string;
  sha256_hash: string;
  event_count: number;
  created_at: string;
  validation_status: string;
}

/**
 * Complete response returned by evidence intake endpoints.
 */
export interface EvidenceResponse {
  evidence_id: string;
  source_type: EvidenceSourceType;
  filename: string | null;
  byte_size: number;
  original_content_sha256: string;
  sha256_hash: string;
  event_count: number;
  created_at: string;
  validation_status: string;
  normalized_events: LogEventCandidate[];
  original_content: string;
  normalized_content: string;
}

/**
 * Backend API error response structure.
 */
export interface ApiErrorDetail {
  detail: string;
  error_code?: string;
}
