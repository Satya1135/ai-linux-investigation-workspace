import React, { useState } from 'react';
import {
  Cpu,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  FileCode,
  RotateCcw,
  CheckCircle2,
  Activity,
  ChevronRight,
  Info,
  Clock,
  Terminal,
  X,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  TimelineEvent,
  InvestigationResponse,
  InvestigationFinding,
  FindingSeverity,
  NavSection,
} from '../types';
import {
  analyzeInvestigation,
  analyzeSampleInvestigation,
} from '../services/api';
import styles from './InvestigationAnalysis.module.css';

interface InvestigationAnalysisProps {
  onNavigate?: (tab: NavSection) => void;
  availableTimelineEvents?: TimelineEvent[];
}

export const InvestigationAnalysis: React.FC<InvestigationAnalysisProps> = ({
  onNavigate,
  availableTimelineEvents,
}) => {
  const [investigationData, setInvestigationData] = useState<InvestigationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'sample' | 'timeline' | null>(null);

  // Modal / Drawer state for inspecting evidence reference
  const [inspectedEventRef, setInspectedEventRef] = useState<string | null>(null);

  // Trigger analysis on sample scenario
  const handleAnalyzeSample = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    setLastAction('sample');
    try {
      const resp = await analyzeSampleInvestigation('sample-privilege-escalation.log');
      setInvestigationData(resp);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to execute sample investigation.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger analysis on current active timeline events
  const handleAnalyzeTimeline = async () => {
    if (isLoading) return;
    if (!availableTimelineEvents || availableTimelineEvents.length === 0) {
      setErrorMessage('No active timeline events found. Ingest logs or load a sample scenario first.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setLastAction('timeline');
    try {
      const resp = await analyzeInvestigation(availableTimelineEvents);
      setInvestigationData(resp);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to execute investigation on timeline events.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry the last triggered action
  const handleRetry = () => {
    if (lastAction === 'timeline') {
      handleAnalyzeTimeline();
    } else {
      handleAnalyzeSample();
    }
  };

  // Helper to format severity classes
  const getSeverityClass = (sev: FindingSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return styles.critical;
      case 'HIGH':
        return styles.high;
      case 'MEDIUM':
        return styles.medium;
      case 'LOW':
      default:
        return styles.low;
    }
  };

  // Resolve matching timeline event from active events in memory if present
  const resolvedInspectedEvent: TimelineEvent | undefined = inspectedEventRef && availableTimelineEvents
    ? availableTimelineEvents.find((e) => e.event_id === inspectedEventRef)
    : undefined;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div className={styles.headingRow}>
            <Cpu size={22} className={styles.titleIcon} />
            <h1 className={styles.heading}>INVESTIGATION ANALYSIS</h1>
            <div className={styles.ruleEngineBadge} title="Transparent local heuristic engine">
              <span className={styles.badgePulse} />
              <span>LOCAL RULE-BASED ANALYSIS</span>
            </div>
            <span className={styles.channelTag}>// ENGINE: DETERMINISTIC SOC (DAY 6)</span>
          </div>
          <p className={styles.subheading}>
            Deterministic multi-stage correlation, attack sequence identification, and evidence-grounded findings synthesis.
          </p>
        </div>

        <div className={styles.headerActions}>
          {availableTimelineEvents && availableTimelineEvents.length > 0 && (
            <button
              type="button"
              className={styles.tacticalBtnSecondary}
              onClick={handleAnalyzeTimeline}
              disabled={isLoading}
              title={`Analyze ${availableTimelineEvents.length} active timeline events`}
            >
              <Activity size={14} />
              <span>ANALYZE TIMELINE ({availableTimelineEvents.length} EVT)</span>
            </button>
          )}

          <button
            type="button"
            className={styles.tacticalBtnPrimary}
            onClick={handleAnalyzeSample}
            disabled={isLoading}
            title="Execute pipeline against pre-packaged privilege escalation scenario"
          >
            <FileCode size={15} />
            <span>ANALYZE SAMPLE SCENARIO</span>
          </button>

          {investigationData && (
            <button
              type="button"
              className={styles.tacticalBtnSecondary}
              onClick={() => setInvestigationData(null)}
              disabled={isLoading}
              title="Clear current investigation findings"
            >
              <RotateCcw size={14} />
              <span>CLEAR</span>
            </button>
          )}
        </div>
      </div>

      {/* Transparent Heuristic Notice Banner */}
      <div className={styles.disclaimerCard}>
        <Info size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Transparent Forensic Methodology:</strong> This investigation pipeline operates entirely via local, deterministic Python rule engines. It does not transmit telemetry to external cloud AI models or third-party APIs. Confidence scores and findings reflect strictly corroborated evidence sequences.
        </div>
      </div>

      {/* Error Banner with Retry Option */}
      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <div className={styles.errorContent}>
            <AlertTriangle size={18} color="var(--accent-rose)" />
            <span>{errorMessage}</span>
          </div>
          <div className={styles.errorActions}>
            <button type="button" className={styles.retryBtn} onClick={handleRetry} disabled={isLoading}>
              RETRY
            </button>
            <button
              type="button"
              className={styles.dismissBtn}
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loadingCard}>
          <Loader2 size={36} className={styles.spinner} />
          <div className={styles.loadingTitle}>RUNNING DEFENSIVE INVESTIGATION PIPELINE...</div>
          <p className={styles.loadingDesc}>
            Validating evidence provenance, evaluating temporal entity clusters, correlating multi-stage attack sequences (Authentication &rarr; Discovery &rarr; Escalation &rarr; Persistence), and calculating grounded confidence scores.
          </p>
        </div>
      )}

      {/* Empty State (Before Any Investigation Runs) */}
      {!investigationData && !isLoading && (
        <div className={styles.emptyStateCard}>
          <div className={styles.emptyIconBox}>
            <Cpu size={32} />
          </div>
          <div className={styles.emptyTitle}>NO ACTIVE INVESTIGATION REPORT</div>
          <p className={styles.emptyDesc}>
            The defensive investigation pipeline analyzes Linux security telemetry to uncover suspicious sequences: authentication brute-forcing, user identity discovery, GTFOBins sudo privilege escalations, remote payload staging in /tmp, SUID backdoors, automated cron persistence, and unauthorized access to /etc/shadow.
          </p>
          <div className={styles.emptyActions}>
            <button
              type="button"
              className={styles.tacticalBtnPrimary}
              onClick={handleAnalyzeSample}
            >
              <FileCode size={15} />
              <span>RUN SAMPLE INVESTIGATION (30 EVENTS)</span>
            </button>
            {availableTimelineEvents && availableTimelineEvents.length > 0 ? (
              <button
                type="button"
                className={styles.tacticalBtnSecondary}
                onClick={handleAnalyzeTimeline}
              >
                <Activity size={14} />
                <span>ANALYZE CURRENT TIMELINE ({availableTimelineEvents.length} EVENTS)</span>
              </button>
            ) : onNavigate ? (
              <button
                type="button"
                className={styles.tacticalBtnSecondary}
                onClick={() => onNavigate('investigation')}
              >
                <Clock size={14} />
                <span>OPEN INVESTIGATION TIMELINE</span>
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Investigation Results Content */}
      {investigationData && !isLoading && (
        <>
          {/* Verdict Banner */}
          <div
            className={`${styles.verdictBanner} ${
              investigationData.verdict === 'SUSPICIOUS_ACTIVITY_DETECTED'
                ? styles.suspicious
                : investigationData.verdict === 'NO_HIGH_CONFIDENCE_FINDINGS'
                ? styles.noFindings
                : styles.insufficient
            }`}
          >
            <div className={styles.verdictHeaderRow}>
              <div className={styles.verdictTitleGroup}>
                {investigationData.verdict === 'SUSPICIOUS_ACTIVITY_DETECTED' ? (
                  <ShieldAlert size={22} color="var(--accent-rose)" />
                ) : investigationData.verdict === 'NO_HIGH_CONFIDENCE_FINDINGS' ? (
                  <AlertCircle size={22} color="var(--accent-amber)" />
                ) : (
                  <HelpCircle size={22} color="var(--accent-cyan-bright)" />
                )}
                <div
                  className={`${styles.verdictBadge} ${
                    investigationData.verdict === 'SUSPICIOUS_ACTIVITY_DETECTED'
                      ? styles.suspicious
                      : investigationData.verdict === 'NO_HIGH_CONFIDENCE_FINDINGS'
                      ? styles.noFindings
                      : styles.insufficient
                  }`}
                >
                  VERDICT: {investigationData.verdict.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            <p className={styles.verdictExplanation}>{investigationData.verdict_explanation}</p>

            {/* Crucial requirement: if no findings, explicitly clarify it does NOT prove the system is safe */}
            {investigationData.verdict === 'NO_HIGH_CONFIDENCE_FINDINGS' && (
              <div className={styles.noFindingsSafetyNote}>
                <AlertCircle size={15} color="var(--accent-amber)" />
                <span>
                  SECURITY NOTE: Absence of high-confidence findings indicates no matching heuristic indicators were detected. It does not constitute definitive proof of system security.
                </span>
              </div>
            )}
          </div>

          {/* KPI Metrics Bar */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>EVENTS ANALYZED</span>
              <span className={styles.kpiValue}>{investigationData.total_events_analyzed}</span>
              <span className={styles.kpiSub}>Sequenced timeline records</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>VALIDATED FINDINGS</span>
              <span className={styles.kpiValue} style={{ color: investigationData.findings_count > 0 ? 'var(--text-rose)' : 'var(--text-emerald)' }}>
                {investigationData.findings_count}
              </span>
              <span className={styles.kpiSub}>High-confidence anomalies (&#8805; 60%)</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>NOISE FILTERED</span>
              <span className={styles.kpiValue} style={{ color: 'var(--text-muted)' }}>
                {investigationData.low_confidence_excluded_count}
              </span>
              <span className={styles.kpiSub}>Low-confidence noise suppressed</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>ANALYSIS METHOD</span>
              <span className={styles.kpiValue} style={{ fontSize: '1.125rem', color: 'var(--accent-cyan-bright)' }}>
                RULE-BASED
              </span>
              <span className={styles.kpiSub}>Local deterministic heuristics</span>
            </div>
          </div>

          {/* Structured Activity History */}
          {investigationData.activities && investigationData.activities.length > 0 && (
            <div className={styles.activitiesSection}>
              <div className={styles.activitiesHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Activity size={14} color="var(--accent-cyan)" />
                  <span>Pipeline Execution Trace</span>
                </div>
                <span>5 / 5 Stages Completed</span>
              </div>
              <div className={styles.activitiesList}>
                {investigationData.activities.map((act, idx) => (
                  <div key={`${act.step}-${idx}`} className={styles.activityRow}>
                    <CheckCircle2 size={15} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span className={styles.activityStepBadge}>{act.step}</span>
                    <span className={styles.activityMessage}>{act.message}</span>
                    <span className={styles.activityTime}>
                      {act.timestamp.includes('T') ? act.timestamp.split('T')[1].slice(0, 8) : act.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Findings List */}
          <div className={styles.findingsSection}>
            <div className={styles.findingsHeader}>
              <div className={styles.findingsTitle}>
                <ShieldAlert size={18} color="var(--accent-cyan)" />
                <span>INVESTIGATION FINDINGS & EVIDENCE PROVENANCE</span>
              </div>
              <span className={styles.findingsCountTag}>
                SHOWING {investigationData.findings.length} ACTIONABLE FINDING(S)
              </span>
            </div>

            {investigationData.findings.length === 0 ? (
              <div className={styles.emptyStateCard} style={{ padding: '2.5rem' }}>
                <ShieldCheck size={32} color="var(--accent-emerald)" />
                <div className={styles.emptyTitle}>NO HIGH-CONFIDENCE FINDINGS DETECTED</div>
                <p className={styles.emptyDesc}>
                  The pipeline completed evaluation without generating alerts meeting the required multi-event corroboration threshold (confidence &#8805; 60%).
                </p>
              </div>
            ) : (
              investigationData.findings.map((f: InvestigationFinding) => {
                const confPercent = Math.round(f.confidence_score * 100);
                return (
                  <div
                    key={f.finding_id}
                    className={`${styles.findingCard} ${getSeverityClass(f.severity)}`}
                  >
                    {/* Header */}
                    <div className={styles.findingHeader}>
                      <div className={styles.findingTitleGroup}>
                        <div className={styles.findingCategoryRow}>
                          <span className={styles.findingIdTag}>{f.finding_id.toUpperCase()}</span>
                          <span className={styles.findingCategoryTag}>
                            {f.category.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h3 className={styles.findingTitle}>{f.title}</h3>
                      </div>

                      <div className={styles.findingBadgesGroup}>
                        <div className={`${styles.severityTag} ${getSeverityClass(f.severity)}`}>
                          <span>{f.severity}</span>
                        </div>
                        <div className={styles.confidenceBadge} title="Confidence derived from evidence consistency">
                          <span>CONFIDENCE: {confPercent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Factual Explanation */}
                    <p className={styles.findingExplanation}>{f.explanation}</p>

                    {/* Actionable Next Step Callout */}
                    <div className={styles.nextStepCallout}>
                      <ChevronRight size={16} color="var(--accent-cyan-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>RECOMMENDED NEXT INVESTIGATION STEP:</strong>
                        <span>{f.recommended_next_step}</span>
                      </div>
                    </div>

                    {/* Provenance & Supporting References */}
                    <div className={styles.provenanceBlock}>
                      <div className={styles.provenanceHeader}>
                        <span>CORROBORATING EVIDENCE REFERENCES ({f.supporting_events.length} EVENTS)</span>
                        <span>LINE INDEXES: [{f.original_event_indexes.join(', ')}]</span>
                      </div>

                      <div className={styles.provenancePills}>
                        {f.supporting_events.map((evtId, idx) => {
                          const origIdx = f.original_event_indexes[idx] ?? f.original_event_indexes[0];
                          return (
                            <button
                              key={evtId}
                              type="button"
                              className={styles.evidenceRefPill}
                              onClick={() => setInspectedEventRef(evtId)}
                              title={`Inspect event reference ${evtId} (Original line #${origIdx})`}
                            >
                              <Terminal size={11} color="var(--accent-cyan)" />
                              <span>{evtId}</span>
                              <span style={{ color: 'var(--text-muted)' }}>#{origIdx}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Entities observed */}
                      <div className={styles.entityTagsRow}>
                        {f.hosts.length > 0 && (
                          <span>
                            HOST(S): <strong>{f.hosts.join(', ')}</strong>
                          </span>
                        )}
                        {f.processes.length > 0 && (
                          <span>
                            PROCESS(ES): <strong>{f.processes.join(', ')}</strong>
                          </span>
                        )}
                        {f.timestamps.length > 0 && (
                          <span>
                            TIME RANGE: <strong>{f.timestamps[0]} &rarr; {f.timestamps[f.timestamps.length - 1]}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Evidence Provenance Inspection Modal */}
      {inspectedEventRef && (
        <div className={styles.eventInspectOverlay} onClick={() => setInspectedEventRef(null)}>
          <div className={styles.eventInspectModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.inspectModalHeader}>
              <div className={styles.inspectModalTitle}>
                <Terminal size={18} color="var(--accent-cyan-bright)" />
                <span>EVIDENCE REFERENCE: {inspectedEventRef}</span>
              </div>
              <button
                type="button"
                className={styles.dismissBtn}
                onClick={() => setInspectedEventRef(null)}
              >
                <X size={18} />
              </button>
            </div>

            {resolvedInspectedEvent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>
                  <span>TIMESTAMP: <strong style={{ color: 'var(--text-primary)' }}>{resolvedInspectedEvent.timestamp || 'N/A'}</strong></span>
                  <span>HOST: <strong style={{ color: 'var(--text-primary)' }}>{resolvedInspectedEvent.host || 'N/A'}</strong></span>
                  <span>PROCESS: <strong style={{ color: 'var(--text-primary)' }}>{resolvedInspectedEvent.process || 'N/A'}</strong></span>
                </div>
                <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>
                  STAGE: <strong style={{ color: 'var(--accent-cyan-bright)' }}>{resolvedInspectedEvent.attack_stage}</strong> | ORIGINAL LINE: <strong style={{ color: 'var(--text-primary)' }}>#{resolvedInspectedEvent.source_line_start}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  VERBATIM LOG MESSAGE (INERT TEXT):
                </div>
                <pre className={styles.rawLogBox}>{resolvedInspectedEvent.raw_message}</pre>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                  Event reference: <code style={{ color: 'var(--accent-cyan-bright)' }}>{inspectedEventRef}</code>
                </p>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-xs)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Detailed verbatim message context for this reference is not loaded into the active client timeline view. To inspect full surrounding log context, open the Investigation Timeline tab.
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    className={styles.tacticalBtnSecondary}
                    onClick={() => {
                      setInspectedEventRef(null);
                      onNavigate('investigation');
                    }}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Clock size={14} />
                    <span>OPEN TIMELINE FOR FULL LOG CONTEXT</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
