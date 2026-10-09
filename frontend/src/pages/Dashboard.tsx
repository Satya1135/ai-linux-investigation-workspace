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
            <span>DAY 4 ENGINE ACTIVE</span>
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

        {/* Card 2: Triage Cases (Truthful State) */}
        <div className={styles.metricCard}>
          <div className={styles.cardCornerTL} />
          <div className={styles.metricHeader}>
            <span>INVESTIGATION CASES</span>
            <Layers size={15} color="var(--accent-cyan)" />
          </div>
          <div className={styles.metricValue} style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
            0 ACTIVE
          </div>
          <div className={styles.metricFootnote}>
            <span>Case storage phased in Day 5+</span>
          </div>
        </div>

        {/* Card 3: Evidence Intake */}
        <div
          className={`${styles.metricCard} ${styles.interactiveCard}`}
          onClick={() => onNavigate && onNavigate('evidence')}
          title="Open Evidence Intake"
        >
          <div className={styles.cardCornerTL} />
          <div className={styles.metricHeader}>
            <span>EVIDENCE INTAKE</span>
            <Terminal size={15} color="var(--accent-cyan-bright)" />
          </div>
          <div className={styles.metricValue} style={{ fontSize: '1.125rem', color: 'var(--accent-cyan-bright)' }}>
            DAY 4 LIVE
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
          title="Open Investigation Analysis (Rule-Based)"
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
            <span style={{ color: 'var(--accent-cyan-bright)' }}>Deterministic Heuristics (Day 6)</span>
            <ArrowRight size={12} color="var(--accent-cyan-bright)" />
          </div>
        </div>
      </div>

      {/* Scope Boundary Notice Card */}
      <div className={styles.noticeCard}>
        <Info size={20} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div className={styles.noticeText}>
          <strong>Day 4 Ingestion Live:</strong> Full evidence upload, log paste, sample loading, SHA-256 integrity verification, and event normalization are operational. Subsequent timeline sequencing and AI synthesis will unlock in upcoming milestones.
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
              <span>Data & Intelligence Layer</span>
            </div>
            <ul className={styles.techList}>
              <li><span className={styles.bullet} /> Supabase PostgreSQL DB</li>
              <li><span className={styles.bullet} /> Supabase Secure Auth</li>
              <li><span className={styles.bullet} /> Anthropic Claude AI Core</li>
              <li><span className={styles.bullet} /> WeasyPrint PDF Engine</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
