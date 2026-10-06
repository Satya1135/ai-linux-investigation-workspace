import React from 'react';
import { Shield, Server } from 'lucide-react';
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

  const getStatusClass = () => {
    if (isLoading) return styles.loading;
    if (isError) return styles.offline;
    return healthData?.status === 'ok' ? styles.online : styles.offline;
  };

  const getStatusLabel = () => {
    if (isLoading) return 'CONNECTING...';
    if (isError) return 'BACKEND OFFLINE';
    return healthData?.status === 'ok' ? 'API ONLINE' : 'DEGRADED';
  };

  return (
    <header className={styles.header}>
      <div className={styles.brandGroup}>
        <div className={styles.logoIcon} aria-hidden="true">
          <Shield size={20} />
        </div>
        <div>
          <h1 className={styles.brandTitle}>
            AI-Powered Linux Investigation Workspace
            <span className={styles.badgeDay3}>Day 3 Foundation</span>
          </h1>
        </div>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.backendStatus} title={`Backend URL: ${API_BASE_URL}`}>
          <Server size={14} className={styles.hostTag} />
          <span className={`${styles.statusIndicator} ${getStatusClass()}`} />
          <span className={styles.statusText}>
            <strong>{getStatusLabel()}</strong>
          </span>
          <span className={styles.hostTag}>({API_BASE_URL.replace(/https?:\/\//, '')})</span>
        </div>
      </div>
    </header>
  );
};
