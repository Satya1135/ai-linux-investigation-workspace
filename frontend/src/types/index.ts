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
