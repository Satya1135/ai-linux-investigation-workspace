import React from 'react';
import { FolderGit2 } from 'lucide-react';
import { CaseSummary } from '../../types';
import styles from '../../pages/Dashboard.module.css';

const PLACEHOLDER_CASES: CaseSummary[] = [
  {
    id: 'CASE-2026-001',
    title: 'Suspicious cron job executing obfuscated ELF binary in /tmp',
    targetHost: 'prod-srv-web01.internal',
    severity: 'CRITICAL',
    status: 'TRIAGE',
    detectedAt: '2026-10-06 20:14:22 UTC',
    indicatorCount: 14,
  },
  {
    id: 'CASE-2026-002',
    title: 'SUID binary capability tampering on /usr/bin/find',
    targetHost: 'db-replica-pg02.internal',
    severity: 'HIGH',
    status: 'ANALYSIS',
    detectedAt: '2026-10-06 21:05:00 UTC',
    indicatorCount: 8,
  },
  {
    id: 'CASE-2026-003',
    title: 'Kernel module persistence anomaly via /etc/modules-load.d',
    targetHost: 'k8s-node-worker-04',
    severity: 'MEDIUM',
    status: 'TRIAGE',
    detectedAt: '2026-10-06 21:45:10 UTC',
    indicatorCount: 5,
  },
];

export const CasesPlaceholder: React.FC = () => {
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return styles.severityCritical;
      case 'HIGH':
        return styles.severityHigh;
      default:
        return styles.severityMedium;
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <FolderGit2 size={18} color="var(--accent-cyan)" />
          <span>Active Investigation Cases (Foundation View)</span>
        </div>
        <span className={styles.sectionBadge}>
          {PLACEHOLDER_CASES.length} cases registered
        </span>
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.casesTable}>
            <thead>
              <tr>
                <th>Case Identifier</th>
                <th>Incident Hypothesis</th>
                <th>Target Host</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Indicators</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_CASES.map((c) => (
                <tr key={c.id}>
                  <td className={styles.caseId}>{c.id}</td>
                  <td className={styles.caseTitle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{c.title}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{c.targetHost}</td>
                  <td>
                    <span className={`${styles.severityChip} ${getSeverityBadgeClass(c.severity)}`}>
                      {c.severity}
                    </span>
                  </td>
                  <td>
                    <span className={styles.statusChip}>
                      <span className={styles.statusDot} />
                      {c.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{c.indicatorCount} artifacts</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {c.detectedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
