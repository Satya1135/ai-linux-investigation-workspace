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
 * Attack stage classification vocabulary.
 */
export type AttackStage =
  | 'AUTHENTICATION'
  | 'RECONNAISSANCE'
  | 'PRIVILEGE_DISCOVERY'
  | 'PRIVILEGE_ESCALATION'
  | 'EXECUTION'
  | 'PERSISTENCE'
  | 'POST_EXPLOITATION'
  | 'OTHER';

/**
 * Standardized event severity levels.
 */
export type EventSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Structured timeline event with deterministic classification and traceability.
 */
export interface TimelineEvent {
  event_id: string;
  timestamp: string | null;
  host: string | null;
  process: string | null;
  event_type: string;
  message: string;
  raw_message: string;
  original_event_index: number;
  source_line_start: number | null;
  source_line_end: number | null;
  suspicious: boolean;
  severity: EventSeverity;
  attack_stage: AttackStage;
  highlight_reason: string | null;
  classification_method: string;
}

/**
 * Timeline request payload.
 */
export interface TimelineRequest {
  events: LogEventCandidate[];
}

/**
 * Timeline response structure from /api/v1/timeline/analyze.
 */
export interface TimelineResponse {
  event_count: number;
  suspicious_count: number;
  stages_detected: AttackStage[];
  timeline: TimelineEvent[];
  classification_method: string;
}

/**
 * Backend API error response structure.
 */
export interface ApiErrorDetail {
  detail: string;
  error_code?: string;
}
