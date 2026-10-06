import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Terminal,
  AlertTriangle,
  FileText,
  Activity,
} from 'lucide-react';
import { NavSection } from '../../types';
import styles from './Sidebar.module.css';

interface SidebarProps {
  currentTab: NavSection;
  onSelectTab: (tab: NavSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    {
      id: 'dashboard' as NavSection,
      label: 'Workspace Overview',
      icon: LayoutDashboard,
      badge: 'Active',
      disabled: false,
    },
    {
      id: 'cases' as NavSection,
      label: 'Investigation Cases',
      icon: FolderGit2,
      badge: 'Placeholder',
      disabled: false,
    },
    {
      id: 'evidence' as NavSection,
      label: 'Evidence Ingestion',
      icon: Terminal,
      badge: 'Day 4',
      disabled: true,
    },
    {
      id: 'investigation' as NavSection,
      label: 'Malware / Priv-Esc',
      icon: AlertTriangle,
      badge: 'Day 5+',
      disabled: true,
    },
    {
      id: 'reports' as NavSection,
      label: 'Forensic Reports',
      icon: FileText,
      badge: 'Day 8+',
      disabled: true,
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.navSection} aria-label="Investigation Workspace Navigation">
        <span className={styles.sectionLabel}>Navigation</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.disabled ? styles.disabled : ''}`}
              onClick={() => !item.disabled && onSelectTab(item.id)}
              disabled={item.disabled}
              title={item.disabled ? `Scheduled for future release (${item.badge})` : item.label}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              <span className={styles.badgeScope}>{item.badge}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.systemBadge}>
          <div className={styles.systemBadgeTitle}>
            <span>Core Engines</span>
            <Activity size={14} color="var(--accent-cyan)" />
          </div>
          <div className={styles.systemBadgeDesc}>
            <div>FastAPI + Pydantic v2</div>
            <div>React + TanStack Query</div>
            <div style={{ color: 'var(--text-emerald)', marginTop: '4px' }}>Foundation Live</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
