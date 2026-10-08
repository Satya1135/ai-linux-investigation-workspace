import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  Clock,
  Cpu,
  FileText,
  Sliders,
  ShieldCheck,
  Radio,
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
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Active',
      disabled: false,
    },
    {
      id: 'evidence' as NavSection,
      label: 'Evidence Intake',
      icon: Terminal,
      badge: 'Live',
      disabled: false,
    },
    {
      id: 'investigation' as NavSection,
      label: 'Investigation Timeline',
      icon: Clock,
      badge: 'Live',
      disabled: false,
    },
    {
      id: 'cases' as NavSection,
      label: 'AI Analysis',
      icon: Cpu,
      badge: 'Day 6+',
      disabled: true,
    },
    {
      id: 'reports' as NavSection,
      label: 'Reports',
      icon: FileText,
      badge: 'Day 8+',
      disabled: true,
    },
    {
      id: 'settings' as NavSection,
      label: 'Settings',
      icon: Sliders,
      badge: 'Config',
      disabled: true,
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.navSection} aria-label="Tactical Navigation">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>// DIRECTIVES</span>
          <span className={styles.hudIndicator}>SYS::ACTIVE</span>
        </div>
        
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
              <div className={styles.iconBox}>
                <Icon size={16} />
              </div>
              <span className={styles.navLabel}>{item.label}</span>
              <span className={styles.badgeScope}>{item.badge}</span>
              {isActive && <div className={styles.activeGlowBar} />}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Tactical Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.nodePanel}>
          <div className={styles.nodePanelHeader}>
            <div className={styles.nodeTitle}>
              <Radio size={12} color="var(--accent-cyan)" className={styles.pulseIcon} />
              <span>NODE::SEC-LN-01</span>
            </div>
            <ShieldCheck size={14} color="var(--accent-emerald)" />
          </div>
          <div className={styles.nodeSpecs}>
            <div className={styles.specRow}>
              <span>CORE:</span>
              <code>FASTAPI + PYDANTIC</code>
            </div>
            <div className={styles.specRow}>
              <span>ENGINE:</span>
              <code>DETERMINISTIC SOC (D5)</code>
            </div>
            <div className={styles.specRow}>
              <span>INTEGRITY:</span>
              <span style={{ color: 'var(--text-emerald)' }}>SHA-256 VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
