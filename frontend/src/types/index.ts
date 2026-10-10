export type NavSection = 'dashboard' | 'cases' | 'evidence' | 'investigation' | 'reports' | 'settings' | 'case-management';

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

/**
 * Finding severity rating vocabulary.
 */
export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * High-level investigation verdict.
 */
export type InvestigationVerdict =
  | 'SUSPICIOUS_ACTIVITY_DETECTED'
  | 'NO_HIGH_CONFIDENCE_FINDINGS'
  | 'INSUFFICIENT_EVIDENCE';

/**
 * Structured investigation finding grounded in timeline evidence.
 */
export interface InvestigationFinding {
  finding_id: string;
  title: string;
  severity: FindingSeverity;
  category: string;
  explanation: string;
  supporting_events: string[];
  original_event_indexes: number[];
  timestamps: string[];
  hosts: string[];
  processes: string[];
  confidence_score: number;
  recommended_next_step: string;
}

/**
 * Structured activity log event representing investigation progress.
 */
export interface InvestigationActivity {
  step: string;
  message: string;
  timestamp: string;
  details?: Record<string, unknown> | null;
}

/**
 * Request payload for POST /api/v1/investigation/analyze.
 */
export interface InvestigationRequest {
  events: TimelineEvent[];
}

/**
 * Response payload returned by defensive investigation pipeline.
 */
export interface InvestigationResponse {
  verdict: InvestigationVerdict;
  verdict_explanation: string;
  total_events_analyzed: number;
  findings_count: number;
  low_confidence_excluded_count: number;
  findings: InvestigationFinding[];
  activities: InvestigationActivity[];
  analysis_method: string;
}



/** Analyst's review is kept separate from immutable original engine output. */
export type AnalystDecision = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'EDITED';
export interface AnalystFindingReview {
  findingId: string;
  decision: AnalystDecision;
  editedTitle: string;
  editedExplanation: string;
  notes: string;
  reviewedAt: string | null;
}
export interface SavedInvestigationCase {
  caseId: string;
  caseName: string;
  createdAt: string;
  updatedAt: string;
  verdict: InvestigationVerdict;
  totalEventsAnalyzed: number;
  analysisMethod: string;
  originalAnalysis: InvestigationResponse;
  reviews: AnalystFindingReview[];
  analystNotes: string;
}
