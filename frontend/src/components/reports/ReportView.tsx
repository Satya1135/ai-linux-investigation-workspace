import React from 'react';
import {
  Printer,
  FileCode,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  Edit3,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { CaseReportData, FindingSeverity, AnalystDecision } from '../../types';
import styles from './ReportView.module.css';

interface ReportViewProps {
  reportData: CaseReportData;
  onPrintPdf: () => void;
  onDownloadHtml: () => void;
  onBack?: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  reportData,
  onPrintPdf,
  onDownloadHtml,
  onBack,
}) => {
  const getSeverityBadgeClass = (severity: FindingSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return styles.badgeCritical;
      case 'HIGH':
        return styles.badgeHigh;
      case 'MEDIUM':
        return styles.badgeMedium;
      case 'LOW':
      default:
        return styles.badgeLow;
    }
  };

  const getDecisionBadgeClass = (decision: AnalystDecision) => {
    switch (decision) {
      case 'CONFIRMED':
        return styles.badgeConfirmed;
      case 'REJECTED':
        return styles.badgeRejected;
      case 'EDITED':
        return styles.badgeEdited;
      case 'PENDING':
      default:
        return styles.badgePending;
    }
  };

  const getDecisionIcon = (decision: AnalystDecision) => {
    switch (decision) {
      case 'CONFIRMED':
        return <CheckCircle size={12} />;
      case 'REJECTED':
        return <XCircle size={12} />;
      case 'EDITED':
        return <Edit3 size={12} />;
      case 'PENDING':
      default:
        return <HelpCircle size={12} />;
    }
  };

  const isSuspicious = reportData.verdict === 'SUSPICIOUS_ACTIVITY_DETECTED';

  return (
    <div className={styles.reportContainer}>
      {/* Top Action Toolbar (Hidden when printing) */}
      <div className={`${styles.actionBar} no-print`} data-no-print="true">
        <div className={styles.actionLeft}>
          {onBack && (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onBack}
              title="Return to previous view"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          )}
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Case ID: <strong className={styles.mono} style={{ color: 'var(--accent-cyan-bright)' }}>{reportData.caseId}</strong>
          </span>
        </div>

        <div className={styles.actionRight}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onDownloadHtml}
            title="Download safe, self-contained standalone HTML report"
          >
            <FileCode size={15} />
            <span>Download HTML Report</span>
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={onPrintPdf}
            title="Open browser print dialog to export as PDF"
          >
            <Printer size={15} />
            <span>Export PDF / Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Body */}
      <article className={styles.documentPaper}>
        {/* Document Header & Metadata */}
        <div className={styles.docHeader}>
          <div className={styles.docEyebrow}>// SOC DEFENSIVE INCIDENT REPORT</div>
          <h1 className={styles.docTitle}>{reportData.caseName}</h1>
          <div className={styles.docTimestamp}>
            Generated: {new Date(reportData.generatedAt).toLocaleString()} | Source: Internal SOC Telemetry
          </div>

          <div className={styles.metadataGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Case Identifier</span>
              <span className={`${styles.metaValue} ${styles.mono}`}>{reportData.caseId}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Investigation Verdict</span>
              <span className={styles.metaValue}>{reportData.verdict.replace(/_/g, ' ')}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Events Evaluated</span>
              <span className={styles.metaValue}>{reportData.totalEventsAnalyzed}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Analysis Methodology</span>
              <span className={styles.metaValue}>{reportData.analysisMethod}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Initial Triage Date</span>
              <span className={styles.metaValue}>
                {new Date(reportData.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Verdict Callout Banner */}
        <section
          className={`${styles.verdictBanner} ${
            isSuspicious ? styles.verdictSuspicious : ''
          }`}
          aria-label="Investigation Verdict"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            {isSuspicious ? (
              <ShieldAlert size={20} color="var(--accent-rose)" />
            ) : (
              <ShieldCheck size={20} color="var(--accent-cyan)" />
            )}
            <h3>INVESTIGATION VERDICT: {reportData.verdict.replace(/_/g, ' ')}</h3>
          </div>
          <p>{reportData.verdictExplanation}</p>
        </section>

        {/* 1. Executive Summary */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <FileText size={18} />
            <span>1. Executive Summary</span>
          </h2>

          <div className={styles.summaryBox}>
            <p>{reportData.executiveSummary}</p>

            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <span className={styles.kpiNumber} style={{ color: 'var(--accent-cyan-bright)' }}>
                  {reportData.findingsCount}
                </span>
                <span className={styles.kpiLabel}>Total Findings</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiNumber} style={{ color: 'var(--accent-emerald-bright)' }}>
                  {reportData.confirmedCount}
                </span>
                <span className={styles.kpiLabel}>Confirmed</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiNumber} style={{ color: 'var(--accent-rose)' }}>
                  {reportData.rejectedCount}
                </span>
                <span className={styles.kpiLabel}>Rejected (FP)</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiNumber} style={{ color: 'var(--accent-cyan)' }}>
                  {reportData.editedCount}
                </span>
                <span className={styles.kpiLabel}>Edited Context</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiNumber} style={{ color: 'var(--accent-amber)' }}>
                  {reportData.pendingCount}
                </span>
                <span className={styles.kpiLabel}>Pending Review</span>
              </div>
            </div>
          </div>

          {reportData.analystNotes && (
            <div className={styles.analystCaseNotes}>
              <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-amber)' }}>
                Case-Level Analyst Directives & Notes:
              </strong>
              <p style={{ margin: 0 }}>{reportData.analystNotes}</p>
            </div>
          )}
        </section>

        {/* 2. Findings & Analyst Review Decisions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <ShieldCheck size={18} />
            <span>2. Findings & Analyst Adjudication ({reportData.findingsCount})</span>
          </h2>

          {reportData.originalFindings.length === 0 ? (
            <div className={styles.noticeBox}>
              No suspicious findings were detected in the evaluated log events.
            </div>
          ) : (
            reportData.originalFindings.map((finding, idx) => {
              const review = reportData.reviews.find((r) => r.findingId === finding.finding_id);
              const decision = review?.decision || 'PENDING';
              const isEdited = decision === 'EDITED';
              const isRejected = decision === 'REJECTED';

              return (
                <article
                  key={finding.finding_id}
                  className={`${styles.findingCard} ${
                    isRejected ? styles.findingRejected : ''
                  }`}
                >
                  <div className={styles.findingHeader}>
                    <div className={styles.findingTitleRow}>
                      <span className={styles.findingIndex}>#{idx + 1}</span>
                      <h3 className={styles.findingTitle}>{finding.title}</h3>
                    </div>

                    <div className={styles.badgeRow}>
                      <span className={`${styles.badge} ${getSeverityBadgeClass(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span
                        className={`${styles.badge} ${getDecisionBadgeClass(decision)}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        {getDecisionIcon(decision)}
                        <span>ANALYST: {decision}</span>
                      </span>
                      <span className={styles.badge} style={{ color: 'var(--text-muted)' }}>
                        CONFIDENCE: {Math.round(finding.confidence_score * 100)}%
                      </span>
                      <span className={styles.badge} style={{ color: 'var(--text-muted)' }}>
                        {finding.category}
                      </span>
                    </div>
                  </div>

                  <div className={styles.explanation}>
                    <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      ORIGINAL RULE-ENGINE EXPLANATION:
                    </strong>
                    <p style={{ margin: 0 }}>{finding.explanation}</p>
                  </div>

                  {isEdited && review?.editedTitle && review.editedTitle !== finding.title && (
                    <div className={styles.analystOverrideBox}>
                      <strong style={{ fontSize: '0.75rem', color: 'var(--accent-cyan-bright)' }}>
                        ANALYST REVISED TITLE:
                      </strong>
                      <span>{review.editedTitle}</span>
                    </div>
                  )}

                  {isEdited && review?.editedExplanation && review.editedExplanation !== finding.explanation && (
                    <div className={styles.analystOverrideBox}>
                      <strong style={{ fontSize: '0.75rem', color: 'var(--accent-cyan-bright)' }}>
                        ANALYST REVISED EXPLANATION:
                      </strong>
                      <span>{review.editedExplanation}</span>
                    </div>
                  )}

                  {review?.notes && (
                    <div className={styles.analystNotesBox}>
                      <strong style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                        ANALYST FINDING NOTES:
                      </strong>
                      <span>{review.notes}</span>
                    </div>
                  )}

                  <div className={styles.nextStepBox}>
                    <strong>Recommended Next Step: </strong>
                    <span>{finding.recommended_next_step}</span>
                  </div>

                  <div className={styles.provenanceBox}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span>
                        Corroborating Events ({finding.supporting_events.length}): [{finding.supporting_events.join(', ')}]
                      </span>
                      <span>
                        Original Line Indexes: [{finding.original_event_indexes.join(', ')}]
                      </span>
                    </div>
                    {finding.hosts && finding.hosts.length > 0 && (
                      <div>Host(s): <strong>{finding.hosts.join(', ')}</strong></div>
                    )}
                    {finding.processes && finding.processes.length > 0 && (
                      <div>Process(es): <strong>{finding.processes.join(', ')}</strong></div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* 3. Investigation Timeline */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Clock size={18} />
            <span>3. Chronological Investigation Timeline ({reportData.timeline.length} Events)</span>
          </h2>

          {reportData.hasTimeline ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Timestamp</th>
                    <th>Event ID</th>
                    <th>Host</th>
                    <th>Process</th>
                    <th>Stage</th>
                    <th>Severity</th>
                    <th>Line</th>
                    <th>Raw Message Snippet</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.timeline.map((evt, idx) => (
                    <tr
                      key={evt.event_id || idx}
                      className={evt.suspicious ? styles.suspiciousRow : ''}
                    >
                      <td className={styles.mono}>{idx + 1}</td>
                      <td className={styles.mono}>{evt.timestamp || 'N/A'}</td>
                      <td className={styles.mono} style={{ color: 'var(--accent-cyan)' }}>
                        {evt.event_id}
                      </td>
                      <td>{evt.host || '-'}</td>
                      <td>{evt.process || '-'}</td>
                      <td>
                        <span className={styles.badge}>{evt.attack_stage}</span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getSeverityBadgeClass(evt.severity as FindingSeverity)}`}>
                          {evt.severity}
                        </span>
                      </td>
                      <td className={`${styles.mono} ${styles.lineIndex}`}>
                        #{evt.source_line_start ?? '-'}
                      </td>
                      <td className={styles.rawLogText}>{evt.raw_message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noticeBox}>
              Chronological timeline telemetry was not stored with this historical case record.
              Specific corroborating event IDs and line numbers remain recorded under Section 2 above.
            </div>
          )}
        </section>

        {/* 4. Investigative Methodology & Boundaries */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Activity size={18} />
            <span>4. Methodology & Investigative Limitations</span>
          </h2>

          <div className={styles.summaryBox}>
            <ul className={styles.limitationsList}>
              {reportData.limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>
        </section>
      </article>
    </div>
  );
};
