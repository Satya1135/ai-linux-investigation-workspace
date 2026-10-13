import React from 'react';
import { FolderGit2, FolderOpen, ArrowRight } from 'lucide-react';
import { NavSection } from '../../types';
import { readSavedCases } from '../../services/caseStorage';
import styles from '../../pages/Dashboard.module.css';

interface CasesPlaceholderProps {
  onNavigate?: (tab: NavSection) => void;
}

export const CasesPlaceholder: React.FC<CasesPlaceholderProps> = ({ onNavigate }) => {
  const savedCases = React.useMemo(() => {
    try {
      return readSavedCases();
    } catch {
      return [];
    }
  }, []);

  const hasCases = savedCases.length > 0;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <FolderGit2 size={18} color="var(--accent-cyan)" />
          <span>Investigation Cases</span>
        </div>
        <span className={styles.sectionBadge}>
          {hasCases
            ? `${savedCases.length} case${savedCases.length > 1 ? 's' : ''} saved (browser-local data)`
            : '0 cases saved in browser storage'}
        </span>
      </div>

      <div className={styles.emptyStateCard}>
        <div className={styles.emptyStateIconBox}>
          {hasCases ? <FolderOpen size={32} /> : <FolderGit2 size={32} />}
        </div>
        <div className={styles.emptyStateTitle}>
          {hasCases
            ? `${savedCases.length} CASE${savedCases.length > 1 ? 'S' : ''} IN BROWSER STORAGE`
            : 'NO SAVED CASES IN BROWSER STORAGE'}
        </div>
        <p className={styles.emptyStateDesc}>
          {hasCases
            ? `You have ${savedCases.length} investigation case${savedCases.length > 1 ? 's' : ''} saved locally in your browser. Review analyst decisions, add investigative notes, and generate executive incident reports in Case Management.`
            : 'Investigation cases and analyst findings are persisted locally in browser storage. Ingest Linux security telemetry to run analysis, record verdicts, and build saved cases.'}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {onNavigate && hasCases && (
            <button
              type="button"
              className={styles.emptyStateBtn}
              onClick={() => onNavigate('case-management')}
            >
              <span>OPEN CASE MANAGEMENT</span>
              <ArrowRight size={14} />
            </button>
          )}
          {onNavigate && (
            <button
              type="button"
              className={styles.emptyStateBtn}
              onClick={() => onNavigate('evidence')}
            >
              <span>GO TO EVIDENCE INTAKE</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
