import React from 'react';
import {
  ShieldCheck,
  Server,
  Layers,
  Database,
  Cpu,
  Terminal,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../services/api';
import { CasesPlaceholder } from '../components/cases/CasesPlaceholder';
import { NavSection } from '../types';
import styles from './Dashboard.module.css';

interface DashboardProps {
  onNavigate?: (tab: NavSection) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { data: healthData, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 10000,
  });

  return (
    <div className={styles.container}>
      {/* Hero Banner */}
      <div className={styles.heroBanner}>
        <div>
          <h2 className={styles.heroTitle}>Forensic Investigation Workspace</h2>
          <p className={styles.heroSubtitle}>
            Unified operations cockpit for Linux malware triage, privilege-escalation chain analysis,
            and automated forensic evidence synthesis. Foundation established for Day 3.
          </p>
        </div>
        <div>
          <div className={styles.heroTag}>
            <ShieldCheck size={16} />
            <span>DAY 3 FOUNDATION READY</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span>Backend Gateway</span>
            <Server size={16} color="var(--accent-cyan)" />
          </div>
          <div className={styles.metricValue}>
            {isLoading ? (
              <span style={{ fontSize: '1.25rem', color: 'var(--accent-amber)' }}>CHECKING...</span>
            ) : isError ? (
              <span style={{ fontSize: '1.25rem', color: 'var(--accent-rose)' }}>OFFLINE</span>
            ) : (
              <span style={{ fontSize: '1.25rem', color: 'var(--accent-emerald)' }}>
                {healthData?.status?.toUpperCase()} (200 OK)
              </span>
            )}
          </div>
          <div className={styles.metricFootnote}>
            <span>Endpoint:</span>
            <code style={{ color: 'var(--accent-cyan)' }}>/health</code>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span>Triage Cases</span>
            <Layers size={16} color="var(--accent-cyan)" />
          </div>
          <div className={styles.metricValue}>3</div>
          <div className={styles.metricFootnote}>
            <span>Foundation schema mock cases</span>
          </div>
        </div>

        <div
          className={styles.metricCard}
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => onNavigate && onNavigate('evidence')}
          title="Open Evidence Intake"
        >
          <div className={styles.metricHeader}>
            <span>Evidence Intake</span>
            <Terminal size={16} color="var(--accent-cyan)" />
          </div>
          <div className={styles.metricValue} style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)' }}>
            DAY 4 LIVE
          </div>
          <div className={styles.metricFootnote}>
            <span>Click to upload, paste, or load samples &rarr;</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span>AI Reasoning Core</span>
            <Cpu size={16} color="var(--accent-cyan)" />
          </div>
          <div className={styles.metricValue}>
            <span style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Claude 3.5</span>
          </div>
          <div className={styles.metricFootnote}>
            <span>Backend-mediated API (Env-driven)</span>
          </div>
        </div>
      </div>

      {/* Notice Card for Foundation Scope */}
      <div className={styles.noticeCard}>
        <Info size={22} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div className={styles.noticeText}>
          <strong>Day 3 Scope Boundary:</strong> This interface represents the foundational
          application shell. Per project requirements, live malware analysis, privilege-escalation detection,
          AI prompt orchestration, and forensic PDF generation will be phased in Days 4-10.
        </div>
      </div>

      {/* Cases Table Placeholder */}
      <CasesPlaceholder />

      {/* Approved Stack Verification Grid */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
            <span>Approved Architecture Matrix</span>
          </div>
          <span className={styles.sectionBadge}>v0.1.0 Architecture Specification</span>
        </div>

        <div className={styles.techStackGrid}>
          <div className={styles.techCard}>
            <div className={styles.techCardHeader}>
              <Layers size={16} />
              <span>Frontend Architecture</span>
            </div>
            <ul className={styles.techList}>
              <li><span className={styles.bullet} /> React 18 + TypeScript</li>
              <li><span className={styles.bullet} /> Vite Fast Build Tooling</li>
              <li><span className={styles.bullet} /> CSS Modules & Variables Design Tokens</li>
              <li><span className={styles.bullet} /> TanStack Query for Asynchronous State</li>
            </ul>
          </div>

          <div className={styles.techCard}>
            <div className={styles.techCardHeader}>
              <Server size={16} />
              <span>Backend Architecture</span>
            </div>
            <ul className={styles.techList}>
              <li><span className={styles.bullet} /> Python 3.12 + FastAPI Core</li>
              <li><span className={styles.bullet} /> Pydantic v2 & Pydantic-Settings</li>
              <li><span className={styles.bullet} /> Configurable Environment Variables</li>
              <li><span className={styles.bullet} /> Pytest & HTTPX Test Coverage</li>
            </ul>
          </div>

          <div className={styles.techCard}>
            <div className={styles.techCardHeader}>
              <Database size={16} />
              <span>Data & Intelligence Layer</span>
            </div>
            <ul className={styles.techList}>
              <li><span className={styles.bullet} /> Supabase PostgreSQL Database</li>
              <li><span className={styles.bullet} /> Supabase Secure Authentication</li>
              <li><span className={styles.bullet} /> Anthropic Claude AI (Backend Only)</li>
              <li><span className={styles.bullet} /> WeasyPrint Forensic PDF Engine</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
