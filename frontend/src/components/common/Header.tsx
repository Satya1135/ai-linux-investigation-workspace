import React from 'react';
import { Shield, Activity, Cpu, Server } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchHealth, API_BASE_URL } from '../../services/api';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const { data: healthData, isError, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 10000,
    retry: 1,
  });

  const getApiStatusClass = () => {
    if (isLoading) return styles.statusLoading;
    if (isError) return styles.statusOffline;
    return healthData?.status === 'ok' ? styles.statusOnline : styles.statusOffline;
  };

  const getApiStatusLabel = () => {
    if (isLoading) return 'CHECKING...';
    if (isError) return 'OFFLINE';
    return healthData?.status === 'ok' ? 'HEALTHY' : 'DEGRADED';
  };

  return (
    <header className={styles.header}>
      {/* Brand & Mission */}
      <div className={styles.brandGroup}>
        <div className={styles.logoBadge} aria-hidden="true">
          <Shield size={22} className={styles.shieldIcon} />
          <div className={styles.cornerDotTL} />
          <div className={styles.cornerDotBR} />
        </div>
        <div className={styles.titleWrapper}>
          <div className={styles.titleRow}>
            <h1 className={styles.brandTitle}>AI LINUX INVESTIGATOR</h1>
            <span className={styles.tacticalTag}>SOC v0.1</span>
          </div>
          <p className={styles.brandSubtitle}>MALWARE & PRIVILEGE-ESCALATION INVESTIGATION WORKSPACE</p>
        </div>
      </div>

      {/* Tactical Status Modules */}
      <div className={styles.statusGrid}>
        {/* Module 1: System */}
        <div className={styles.hudModule}>
          <div className={styles.hudModuleHeader}>
            <Activity size={12} color="var(--accent-cyan)" />
            <span>SYSTEM STATUS</span>
          </div>
          <div className={styles.hudModuleValue}>
            <span className={`${styles.statusDot} ${styles.statusOnline}`} />
            <span className={styles.onlineText}>ONLINE</span>
          </div>
        </div>

        {/* Module 2: Backend API */}
        <div className={styles.hudModule} title={`Backend URL: ${API_BASE_URL}`}>
          <div className={styles.hudModuleHeader}>
            <Server size={12} color="var(--accent-cyan)" />
            <span>BACKEND API</span>
          </div>
          <div className={styles.hudModuleValue}>
            <span className={`${styles.statusDot} ${getApiStatusClass()}`} />
            <span className={isError ? styles.offlineText : styles.onlineText}>
              {getApiStatusLabel()}
            </span>
          </div>
        </div>

        {/* Module 3: AI Engine */}
        <div className={styles.hudModule}>
          <div className={styles.hudModuleHeader}>
            <Cpu size={12} color="var(--accent-cyan)" />
            <span>AI ENGINE</span>
          </div>
          <div className={styles.hudModuleValue}>
            <span className={`${styles.statusDot} ${styles.statusOnline}`} />
            <span className={styles.onlineText}>READY</span>
          </div>
        </div>
      </div>
    </header>
  );
};
