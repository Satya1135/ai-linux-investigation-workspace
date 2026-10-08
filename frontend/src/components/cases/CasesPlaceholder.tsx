import React from 'react';
import { FolderGit2, ArrowRight } from 'lucide-react';
import { NavSection } from '../../types';
import styles from '../../pages/Dashboard.module.css';

interface CasesPlaceholderProps {
  onNavigate?: (tab: NavSection) => void;
}

export const CasesPlaceholder: React.FC<CasesPlaceholderProps> = ({ onNavigate }) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <FolderGit2 size={18} color="var(--accent-cyan)" />
          <span>Active Investigation Cases (Foundation View)</span>
        </div>
        <span className={styles.sectionBadge}>
          0 cases active in repository
        </span>
      </div>

      <div className={styles.emptyStateCard}>
        <div className={styles.emptyStateIconBox}>
          <FolderGit2 size={32} />
        </div>
        <div className={styles.emptyStateTitle}>NO ACTIVE CASES IN REPOSITORY</div>
        <p className={styles.emptyStateDesc}>
          Persistent case management, database storage, and multi-artifact timeline correlation are scheduled for future milestones (Day 5+). Currently in <strong>Day 4 Evidence Intake</strong> mode. Ingest Linux security telemetry to analyze evidence.
        </p>
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
  );
};
