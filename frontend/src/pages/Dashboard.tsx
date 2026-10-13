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
  Radio,
  ArrowRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../services/api';
import { CasesPlaceholder } from '../components/cases/CasesPlaceholder';
import { readSavedCases } from '../services/caseStorage';
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

  const savedCases = React.useMemo(() => {
    try {
      return readSavedCases();
    } catch {
      return [];
    }
  }, []);

  return (
    <div className={styles.container}>
      {/* Tactical Hero Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.cornerTL} />
        <div className={styles.cornerBR} />
        <div className={styles.heroLeft}>
          <div className={styles.heroHeaderRow}>
            <Radio size={16} color="var(--accent-cyan-bright)" className={styles.pulseRadar} />
            <span className={styles.heroTag}>SECURITY OPERATIONS COCKPIT</span>
          </div>
          <h2 className={styles.heroTitle}>Forensic Investigation Workspace</h2>
          <p className={styles.heroSubtitle}>
            Unified command console for Linux malware triage, privilege-escalation detection, and automated forensic evidence synthesis.
          </p>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.statusBadge}>
            <ShieldCheck size={16} color="var(--accent-emerald)" />
            <span>INVESTIGATION SUITE ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Tactical Metrics Grid */}
      <div className={styles.metricsGrid}>
        {/* Card 1: Backend Gateway */}
        <div className={styles.metricCard}>
          <div className={styles.cardCornerTL} />
          <div className={styles.metricHeader}>
            <span>BACKEND GATEWAY</span>
            <Server size={15} color="var(--accent-cyan)" />
          </div>
          <div className={styles.metricValue}>
            {isLoading ? (
              <span style={{ fontSize: '1.125rem', color: 'var(--accent-amber)' }}>CHECKING...</span>
            ) : isError ? (
              <span style={{ fontSize: '1.125rem', color: 'var(--accent-rose)' }}>OFFLINE</span>
            ) : (
              <span style={{ fontSize: '1.125rem', color: 'var(--accent-emerald)' }}>
                {healthData?.status?.toUpperCase()} (200 OK)
              </span>
            )}
          </div>
          <div className={styles.metricFootnote}>
            <span>ENDPOINT:</span>
            <code>/health</code>
          </div>
        </div>

        {/* Card 2: Saved Cases (Browser-Local Data) */}
        <div
          className={`${styles.metricCard} ${styles.interactiveCard}`}
          onClick={() => onNavigate && onNavigate('case-management')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate && onNavigate('case-management');
            }
          }}
          role="button"
          tabIndex={0}
          title="Open Case Management"
          aria-label="Open Case Management: view saved cases"
        >
          <div className={styles.cardCornerTL} />
          <div className={styles.metricHeader}>
            <span>INVESTIGATION CASES</span>
            <Layers size={15} color="var(--accent-cyan-bright)" />
          </div>
          <div className={styles.metricValue} style={{ fontSize: '1.125rem', color: 'var(--accent-cyan-bright)' }}>
            {savedCases.length} {savedCases.length === 1 ? 'SAVED' : 'SAVED'}
          </div>
          <div className={styles.metricFootnote}>
            <span style={{ color: 'var(--accent-cyan-bright)' }}>Browser-local storage</span>
            <ArrowRight size={12} color="var(--accent-cyan-bright)" />
          </div>
        </div>

        {/* Card 3: Evidence Intake */}
        <div
          className={`${styles.metricCard} ${styles.interactiveCard}`}
          onClick={() => onNavigate && onNavigate('evidence')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate && onNavigate('evidence');
            }
          }}
          role="button"
          tabIndex={0}
          title="Open Evidence Intake"
          aria-label="Open Evidence Intake: ingest logs and samples"
        >
          <div className={styles.cardCornerTL} />
          <div className={styles.metricHeader}>
            <span>EVIDENCE INTAKE</span>
            <Terminal size={15} color="var(--accent-cyan-bright)" />
          </div>
          <div className={styles.metricValue} style={{ fontSize: '1.125rem', color: 'var(--accent-cyan-bright)' }}>
            OPERATIONAL
          </div>
          <div className={styles.metricFootnote}>
            <span style={{ color: 'var(--accent-cyan-bright)' }}>Ingest logs & samples</span>
            <ArrowRight size={12} color="var(--accent-cyan-bright)" />
          </div>
        </div>

        {/* Card 4: Local Rule-Based Analysis */}
        <div
          className={`${styles.metricCard} ${styles.interactiveCard}`}
          onClick={() => onNavigate && onNavigate('cases')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate && onNavigate('cases');
            }
          }}
          role="button"
          tabIndex={0}
          title="Open Investigation Analysis (Rule-Based)"
          aria-label="Open Investigation Analysis: local deterministic heuristics engine"
        >
          <div className={styles.cardCornerTL} />
          <div className={styles.metricHeader}>
            <span>INVESTIGATION ANALYSIS</span>
            <Cpu size={15} color="var(--accent-cyan-bright)" />
          </div>
          <div className={styles.metricValue}>
            <span style={{ fontSize: '1.125rem', color: 'var(--accent-cyan-bright)' }}>LOCAL RULES</span>
          </div>
          <div className={styles.metricFootnote}>
            <span style={{ color: 'var(--accent-cyan-bright)' }}>Deterministic Heuristics Engine</span>
            <ArrowRight size={12} color="var(--accent-cyan-bright)" />
          </div>
        </div>
      </div>

      {/* Scope Boundary Notice Card */}
      <div className={styles.noticeCard}>
        <Info size={20} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div className={styles.noticeText}>
          <strong>Forensic Pipeline Operational:</strong> Evidence intake, timeline sequencing, heuristic investigation analysis, analyst case management (stored in browser-local storage), and incident reporting with native print-to-PDF / standalone HTML export are active.
        </div>
      </div>

      {/* Cases Table Placeholder */}
      <CasesPlaceholder onNavigate={onNavigate} />

      {/* Approved Stack Verification Grid */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
            <span>APPROVED ARCHITECTURE MATRIX</span>
          </div>
          <span className={styles.sectionBadge}>SOC PLATFORM SPECIFICATION</span>
        </div>

        <div className={styles.techStackGrid}>
          <div className={styles.techCard}>
            <div className={styles.techCardHeader}>
              <Layers size={16} />
              <span>Frontend Architecture</span>
            </div>
            <ul className={styles.techList}>
              <li><span className={styles.bullet} /> React 18 + TypeScript</li>
              <li><span className={styles.bullet} /> Vite Fast Tooling</li>
              <li><span className={styles.bullet} /> Cyber Defense CSS Modules</li>
              <li><span className={styles.bullet} /> TanStack Query State Layer</li>
            </ul>
          </div>

          <div className={styles.techCard}>
            <div className={styles.techCardHeader}>
              <Server size={16} />
              <span>Backend Architecture</span>
            </div>
            <ul className={styles.techList}>
              <li><span className={styles.bullet} /> Python 3.12 + FastAPI Core</li>
              <li><span className={styles.bullet} /> Pydantic v2 Settings & Schemas</li>
              <li><span className={styles.bullet} /> Secure Env-driven Configuration</li>
              <li><span className={styles.bullet} /> Pytest & HTTPX Test Coverage</li>
            </ul>
          </div>

          <div className={styles.techCard}>
            <div className={styles.techCardHeader}>
              <Database size={16} />
              <span>Data & Reporting Layer</span>
            </div>
            <ul className={styles.techList}>
              <li><span className={styles.bullet} /> Browser Local Case Storage</li>
              <li><span className={styles.bullet} /> Supabase PostgreSQL DB (Configured)</li>
              <li><span className={styles.bullet} /> Heuristic Detection Engine</li>
              <li><span className={styles.bullet} /> Native Print-to-PDF & HTML Export</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
