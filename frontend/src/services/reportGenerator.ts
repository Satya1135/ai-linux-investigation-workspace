import {
  SavedInvestigationCase,
  CaseReportData,
  TimelineEvent,
  InvestigationFinding,
  AnalystFindingReview,
} from '../types';

/**
 * Escapes untrusted text to prevent XSS when generating HTML reports.
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) {
    return '';
  }
  const str = String(input);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a filesystem-safe filename for report downloads.
 */
export function sanitizeFilename(input: string): string {
  const sanitized = input
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return sanitized.length > 0 ? sanitized : 'investigation-report';
}

/**
 * Builds a structured, complete CaseReportData object from a saved case
 * and optional in-memory timeline events.
 */
export function buildReportData(
  caseRecord: SavedInvestigationCase,
  activeTimelineEvents?: TimelineEvent[]
): CaseReportData {
  const now = new Date().toISOString();

  // Resolve timeline: prefer stored timeline, fallback to in-memory active timeline
  let resolvedTimeline: TimelineEvent[] = [];
  if (caseRecord.timeline && Array.isArray(caseRecord.timeline) && caseRecord.timeline.length > 0) {
    resolvedTimeline = [...caseRecord.timeline];
  } else if (activeTimelineEvents && Array.isArray(activeTimelineEvents) && activeTimelineEvents.length > 0) {
    resolvedTimeline = [...activeTimelineEvents];
  }

  // Ensure chronological ordering: timestamp ascending, then original_event_index
  resolvedTimeline.sort((a, b) => {
    const timeA = a.timestamp || '';
    const timeB = b.timestamp || '';
    if (timeA && timeB && timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }
    return (a.original_event_index ?? 0) - (b.original_event_index ?? 0);
  });

  const hasTimeline = resolvedTimeline.length > 0;

  const reviews: AnalystFindingReview[] = Array.isArray(caseRecord.reviews) ? caseRecord.reviews : [];
  const findings: InvestigationFinding[] = caseRecord.originalAnalysis?.findings || [];

  const confirmedCount = reviews.filter((r) => r.decision === 'CONFIRMED').length;
  const rejectedCount = reviews.filter((r) => r.decision === 'REJECTED').length;
  const editedCount = reviews.filter((r) => r.decision === 'EDITED').length;
  const pendingCount = reviews.filter((r) => r.decision === 'PENDING').length;

  // Extract unique hosts and categories
  const categories = Array.from(new Set(findings.map((f) => f.category))).filter(Boolean);
  const hosts = Array.from(
    new Set(findings.flatMap((f) => f.hosts || []).concat(resolvedTimeline.map((e) => e.host || '').filter(Boolean)))
  );

  // Synthesize executive summary
  let verdictSummaryText = '';
  switch (caseRecord.verdict) {
    case 'SUSPICIOUS_ACTIVITY_DETECTED':
      verdictSummaryText =
        'Suspicious Linux privilege-escalation and anomalous system activity was detected during automated correlation.';
      break;
    case 'NO_HIGH_CONFIDENCE_FINDINGS':
      verdictSummaryText =
        'No high-confidence indicators of malicious compromise or privilege escalation were identified across the evaluated logs.';
      break;
    case 'INSUFFICIENT_EVIDENCE':
    default:
      verdictSummaryText =
        'Submitted log telemetry was insufficient or too sparse to establish high-confidence security findings.';
      break;
  }

  const reviewBreakdown = `Automated analysis surfaced ${findings.length} initial finding(s). SOC analyst triage determined: ${confirmedCount} confirmed, ${rejectedCount} rejected as false positive(s), ${editedCount} amended with analyst context, and ${pendingCount} pending review.`;

  const scopeDetails = `Investigation evaluated ${caseRecord.totalEventsAnalyzed ?? 0} log events${
    hosts.length > 0 ? ` on host(s) [${hosts.join(', ')}]` : ''
  }${categories.length > 0 ? ` across category tags: ${categories.join(', ')}` : ''}.`;

  const executiveSummary = `${verdictSummaryText} ${scopeDetails} ${reviewBreakdown}`;

  // Transparency: explicit limitations
  const limitations: string[] = [
    'Automated findings were generated using deterministic pattern and sequence correlation rules. No live external LLM (Claude API) was queried.',
    'Evidence provenance is strictly grounded in submitted Linux logs; uncaptured system activity and unlogged memory execution are out of scope.',
    'Analyst confirmation or rejection reflects manual SOC adjudication based on available contextual evidence.',
  ];

  if (!hasTimeline) {
    limitations.push(
      'Full chronological timeline telemetry was not preserved with this historical case record; finding corroboration references and original line indices remain recorded below.'
    );
  }

  return {
    caseId: caseRecord.caseId,
    caseName: caseRecord.caseName || 'Linux Security Investigation',
    generatedAt: now,
    createdAt: caseRecord.createdAt || now,
    updatedAt: caseRecord.updatedAt || now,
    verdict: caseRecord.verdict,
    verdictExplanation:
      caseRecord.originalAnalysis?.verdict_explanation ||
      'Defensive investigation completed on submitted log events.',
    analysisMethod: caseRecord.analysisMethod || 'rule_based',
    totalEventsAnalyzed: caseRecord.totalEventsAnalyzed ?? 0,
    findingsCount: findings.length,
    confirmedCount,
    rejectedCount,
    editedCount,
    pendingCount,
    executiveSummary,
    analystNotes: caseRecord.analystNotes || '',
    originalFindings: findings,
    reviews,
    timeline: resolvedTimeline,
    hasTimeline,
    limitations,
  };
}

/**
 * Compiles a self-contained, sanitized, printable HTML report.
 */
export function generateHtmlReport(report: CaseReportData): string {
  const getReviewFor = (findingId: string): AnalystFindingReview | undefined => {
    return report.reviews.find((r) => r.findingId === findingId);
  };

  const findingsHtml = report.originalFindings
    .map((f, idx) => {
      const review = getReviewFor(f.finding_id);
      const decision = review?.decision || 'PENDING';
      const isEdited = decision === 'EDITED';
      const isRejected = decision === 'REJECTED';
      const isConfirmed = decision === 'CONFIRMED';

      const decisionBadgeColor = isConfirmed
        ? '#10b981'
        : isRejected
        ? '#ef4444'
        : isEdited
        ? '#38bdf8'
        : '#f59e0b';

      return `
      <div class="finding-card ${isRejected ? 'finding-rejected' : ''}">
        <div class="finding-header">
          <div class="finding-title-row">
            <span class="finding-index">#${idx + 1}</span>
            <h3 class="finding-title">${escapeHtml(f.title)}</h3>
          </div>
          <div class="badge-row">
            <span class="badge badge-severity badge-${f.severity.toLowerCase()}">${escapeHtml(f.severity)}</span>
            <span class="badge" style="border-color:${decisionBadgeColor};color:${decisionBadgeColor};background:rgba(255,255,255,0.03);">
              ANALYST: ${escapeHtml(decision)}
            </span>
            <span class="badge badge-muted">CONFIDENCE: ${Math.round(f.confidence_score * 100)}%</span>
            <span class="badge badge-muted">${escapeHtml(f.category)}</span>
          </div>
        </div>

        <div class="section-sub">
          <strong>Original Engine Explanation:</strong>
          <p>${escapeHtml(f.explanation)}</p>
        </div>

        ${
          isEdited && review?.editedTitle && review.editedTitle !== f.title
            ? `<div class="analyst-override">
                <strong>Analyst Revised Title:</strong>
                <p>${escapeHtml(review.editedTitle)}</p>
              </div>`
            : ''
        }

        ${
          isEdited && review?.editedExplanation && review.editedExplanation !== f.explanation
            ? `<div class="analyst-override">
                <strong>Analyst Revised Explanation:</strong>
                <p>${escapeHtml(review.editedExplanation)}</p>
              </div>`
            : ''
        }

        ${
          review?.notes
            ? `<div class="analyst-notes-block">
                <strong>Analyst Finding Notes:</strong>
                <p>${escapeHtml(review.notes)}</p>
              </div>`
            : ''
        }

        <div class="next-step-box">
          <strong>Recommended Next Action:</strong>
          <span>${escapeHtml(f.recommended_next_step)}</span>
        </div>

        <div class="provenance-box">
          <div class="provenance-meta">
            <span>Corroborating Events (${f.supporting_events.length}): [${f.supporting_events.map(escapeHtml).join(', ')}]</span>
            <span>Original Line Indexes: [${f.original_event_indexes.map((n) => escapeHtml(String(n))).join(', ')}]</span>
          </div>
          ${
            f.hosts && f.hosts.length > 0
              ? `<div>Host(s): <strong>${f.hosts.map(escapeHtml).join(', ')}</strong></div>`
              : ''
          }
          ${
            f.processes && f.processes.length > 0
              ? `<div>Process(es): <strong>${f.processes.map(escapeHtml).join(', ')}</strong></div>`
              : ''
          }
        </div>
      </div>`;
    })
    .join('\n');

  const timelineRowsHtml = report.timeline
    .map((e, idx) => {
      const isSuspicious = e.suspicious;
      return `
      <tr class="${isSuspicious ? 'row-suspicious' : ''}">
        <td class="mono">${idx + 1}</td>
        <td class="mono">${escapeHtml(e.timestamp || 'N/A')}</td>
        <td class="mono">${escapeHtml(e.event_id)}</td>
        <td>${escapeHtml(e.host || '-')}</td>
        <td>${escapeHtml(e.process || '-')}</td>
        <td><span class="badge badge-stage">${escapeHtml(e.attack_stage)}</span></td>
        <td><span class="badge badge-${e.severity.toLowerCase()}">${escapeHtml(e.severity)}</span></td>
        <td class="mono line-idx">#${escapeHtml(String(e.source_line_start ?? '-'))}</td>
        <td class="log-message mono">${escapeHtml(e.raw_message)}</td>
      </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Incident Report — ${escapeHtml(report.caseId)}</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #0f172a;
      --border: #1e293b;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --cyan: #38bdf8;
      --green: #10b981;
      --red: #ef4444;
      --orange: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      padding: 2.5rem 1.5rem;
    }
    .container { max-width: 1040px; margin: 0 auto; }
    .header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    .eyebrow {
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      color: var(--cyan);
      text-transform: uppercase;
      font-family: monospace;
      margin-bottom: 0.25rem;
    }
    h1 { font-size: 2rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-top: 1.25rem;
      background: var(--card-bg);
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .meta-item { font-size: 0.8125rem; }
    .meta-label { color: var(--text-muted); display: block; font-size: 0.75rem; text-transform: uppercase; }
    .meta-value { font-weight: 600; color: #fff; }
    .verdict-box {
      margin: 1.5rem 0;
      padding: 1.25rem;
      border-radius: 6px;
      border-left: 4px solid var(--cyan);
      background: rgba(56, 189, 248, 0.05);
    }
    .verdict-box.critical { border-left-color: var(--red); background: rgba(239, 68, 68, 0.05); }
    .verdict-box h2 { font-size: 1.125rem; margin-bottom: 0.35rem; }
    .section { margin: 2.5rem 0; }
    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .summary-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 1.25rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .kpi-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
    .kpi { display: flex; flex-direction: column; }
    .kpi-num { font-size: 1.5rem; font-weight: 700; color: var(--cyan); }
    .kpi-lbl { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
    .finding-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      page-break-inside: avoid;
    }
    .finding-rejected {
      opacity: 0.75;
      border-left: 4px solid var(--red);
    }
    .finding-header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .finding-title-row { display: flex; align-items: baseline; gap: 0.5rem; }
    .finding-index { font-family: monospace; color: var(--cyan); font-weight: 700; }
    .finding-title { font-size: 1.1rem; color: #fff; }
    .badge-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 4px;
      border: 1px solid var(--border);
      font-family: monospace;
    }
    .badge-critical { color: var(--red); border-color: var(--red); background: rgba(239, 68, 68, 0.1); }
    .badge-high { color: #f97316; border-color: #f97316; background: rgba(249, 115, 22, 0.1); }
    .badge-medium { color: var(--orange); border-color: var(--orange); background: rgba(245, 158, 11, 0.1); }
    .badge-low { color: var(--cyan); border-color: var(--cyan); background: rgba(56, 189, 248, 0.1); }
    .badge-stage { color: var(--cyan); border-color: var(--border); }
    .badge-muted { color: var(--text-muted); }
    .section-sub { margin-bottom: 0.75rem; font-size: 0.875rem; }
    .analyst-override {
      background: rgba(56, 189, 248, 0.05);
      border-left: 3px solid var(--cyan);
      padding: 0.6rem 0.75rem;
      margin: 0.75rem 0;
      font-size: 0.875rem;
    }
    .analyst-notes-block {
      background: rgba(245, 158, 11, 0.05);
      border-left: 3px solid var(--orange);
      padding: 0.6rem 0.75rem;
      margin: 0.75rem 0;
      font-size: 0.875rem;
    }
    .next-step-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed var(--border);
      padding: 0.6rem 0.75rem;
      margin: 0.75rem 0;
      font-size: 0.8125rem;
    }
    .provenance-box {
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
      background: rgba(0, 0, 0, 0.2);
      padding: 0.6rem 0.75rem;
      border-radius: 4px;
      margin-top: 0.75rem;
    }
    .provenance-meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.25rem; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      margin-top: 1rem;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0.5rem 0.65rem;
      text-align: left;
    }
    th {
      background: var(--card-bg);
      color: var(--text-muted);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    tr.row-suspicious td { background: rgba(239, 68, 68, 0.04); }
    .mono { font-family: monospace; }
    .line-idx { color: var(--cyan); }
    .log-message {
      font-size: 0.75rem;
      max-width: 380px;
      word-break: break-all;
    }
    .notice {
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin: 1rem 0;
    }
    .footer {
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
      margin-top: 3rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      text-align: center;
    }

    /* Print Specific Styles */
    @media print {
      body {
        background: #ffffff !important;
        color: #0f172a !important;
        padding: 0 !important;
      }
      .container { max-width: 100% !important; margin: 0 !important; }
      h1 { color: #000 !important; }
      .meta-grid, .summary-card, .finding-card, th {
        background: #ffffff !important;
        border-color: #cbd5e1 !important;
        color: #0f172a !important;
      }
      .meta-label, .kpi-lbl, .badge-muted { color: #475569 !important; }
      .meta-value, .finding-title, .section-title { color: #000 !important; }
      .verdict-box {
        background: #f8fafc !important;
        border-left-width: 4px !important;
      }
      .finding-card { page-break-inside: avoid; border: 1px solid #cbd5e1 !important; }
      table, th, td {
        border-color: #cbd5e1 !important;
        color: #0f172a !important;
      }
      .log-message { max-width: none !important; word-break: break-word !important; }
      @page {
        margin: 12mm;
        size: A4 portrait;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="eyebrow">// SOC DEFENSIVE INCIDENT REPORT</div>
      <h1>${escapeHtml(report.caseName)}</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;">Generated on ${escapeHtml(
        new Date(report.generatedAt).toLocaleString()
      )}</p>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Case Identifier</span>
          <span class="meta-value mono">${escapeHtml(report.caseId)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Investigation Verdict</span>
          <span class="meta-value">${escapeHtml(report.verdict.replace(/_/g, ' '))}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Events Evaluated</span>
          <span class="meta-value">${report.totalEventsAnalyzed}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Analysis Method</span>
          <span class="meta-value">${escapeHtml(report.analysisMethod)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Initial Assessment</span>
          <span class="meta-value">${escapeHtml(new Date(report.createdAt).toLocaleDateString())}</span>
        </div>
      </div>
    </header>

    <div class="verdict-box ${report.verdict === 'SUSPICIOUS_ACTIVITY_DETECTED' ? 'critical' : ''}">
      <h2>INVESTIGATION VERDICT: ${escapeHtml(report.verdict.replace(/_/g, ' '))}</h2>
      <p>${escapeHtml(report.verdictExplanation)}</p>
    </div>

    <section class="section">
      <h2 class="section-title">1. Executive Summary</h2>
      <div class="summary-card">
        <p>${escapeHtml(report.executiveSummary)}</p>

        <div class="kpi-row">
          <div class="kpi">
            <span class="kpi-num">${report.findingsCount}</span>
            <span class="kpi-lbl">Total Findings</span>
          </div>
          <div class="kpi">
            <span class="kpi-num" style="color:var(--green);">${report.confirmedCount}</span>
            <span class="kpi-lbl">Confirmed</span>
          </div>
          <div class="kpi">
            <span class="kpi-num" style="color:var(--red);">${report.rejectedCount}</span>
            <span class="kpi-lbl">Rejected</span>
          </div>
          <div class="kpi">
            <span class="kpi-num" style="color:var(--cyan);">${report.editedCount}</span>
            <span class="kpi-lbl">Edited Context</span>
          </div>
          <div class="kpi">
            <span class="kpi-num" style="color:var(--orange);">${report.pendingCount}</span>
            <span class="kpi-lbl">Pending Review</span>
          </div>
        </div>
      </div>

      ${
        report.analystNotes
          ? `<div class="analyst-notes-block">
              <strong>Case-Level Analyst Directives & Notes:</strong>
              <p>${escapeHtml(report.analystNotes)}</p>
            </div>`
          : ''
      }
    </section>

    <section class="section">
      <h2 class="section-title">2. Findings & Analyst Adjudication (${report.findingsCount})</h2>
      ${
        report.originalFindings.length === 0
          ? `<p class="notice">No suspicious findings detected in this investigation dataset.</p>`
          : findingsHtml
      }
    </section>

    <section class="section">
      <h2 class="section-title">3. Investigation Timeline (${report.timeline.length} Events)</h2>
      ${
        report.hasTimeline
          ? `<table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Timestamp</th>
                  <th>Event ID</th>
                  <th>Host</th>
                  <th>Process</th>
                  <th>Attack Stage</th>
                  <th>Severity</th>
                  <th>Line</th>
                  <th>Raw Message</th>
                </tr>
              </thead>
              <tbody>
                ${timelineRowsHtml}
              </tbody>
            </table>`
          : `<div class="notice">
              Chronological timeline telemetry was not stored with this historical case record.
              All corroborating event references and line numbers are preserved in Section 2 above.
            </div>`
      }
    </section>

    <section class="section">
      <h2 class="section-title">4. Investigative Methodology & Limitations</h2>
      <div class="summary-card">
        <ul style="padding-left:1.25rem;">
          ${report.limitations.map((lim) => `<li style="margin-bottom:0.35rem;">${escapeHtml(lim)}</li>`).join('\n')}
        </ul>
      </div>
    </section>

    <footer class="footer">
      <div>AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace</div>
      <div>Forensic incident artifact for internal SOC authorization and triage.</div>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Triggers browser download of the standalone HTML report.
 */
export function downloadHtmlReport(report: CaseReportData): void {
  const htmlContent = generateHtmlReport(report);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const filename = `${sanitizeFilename(report.caseId)}-report.html`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
