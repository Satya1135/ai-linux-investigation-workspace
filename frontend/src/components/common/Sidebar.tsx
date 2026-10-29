import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Terminal,
  Clock,
  Cpu,
  FileText,
  Sliders,
  ShieldCheck,
  Radio,
  FolderOpen,
  X,
  Shield,
} from 'lucide-react';
import { NavSection } from '../../types';
import styles from './Sidebar.module.css';

interface SidebarProps {
  currentTab: NavSection;
  onSelectTab: (tab: NavSection) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  mobileToggleRef?: React.RefObject<HTMLButtonElement>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
  mobileToggleRef,
}) => {
  // Close drawer on Escape key and restore focus to toggle button
  useEffect(() => {
    if (!isOpenMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile?.();
        mobileToggleRef?.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile, onCloseMobile, mobileToggleRef]);

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
      badge: 'Live',
      disabled: false,
    },
    {
      id: 'case-management' as NavSection,
      label: 'Saved Cases',
      icon: FolderOpen,
      badge: 'Day 7',
      disabled: false,
    },
    {
      id: 'reports' as NavSection,
      label: 'Reports',
      icon: FileText,
      badge: 'Day 8',
      disabled: false,
    },
    {
      id: 'settings' as NavSection,
      label: 'Settings',
      icon: Sliders,
      badge: 'Config',
      disabled: false,
    },
  ];

  return (
    <>
      {isOpenMobile && (
        <div
          className={styles.backdrop}
          onClick={onCloseMobile}
          role="presentation"
          aria-hidden="true"
        />
      )}
      <aside
        id="mobile-nav-sidebar"
        className={`${styles.sidebar} ${isOpenMobile ? styles.mobileOpen : ''} no-print`}
        data-no-print="true"
        aria-label="Tactical Navigation"
      >
        <div className={styles.mobileDrawerHeader}>
          <div className={styles.mobileDrawerTitle}>
            <Shield size={16} color="var(--accent-cyan-bright)" />
            <span>NAVIGATION DIRECTIVES</span>
          </div>
          <button
            type="button"
            className={styles.mobileCloseBtn}
            onClick={() => {
              onCloseMobile?.();
              mobileToggleRef?.current?.focus();
            }}
            aria-label="Close navigation drawer"
          >
            <X size={18} />
          </button>
        </div>

        <nav className={styles.navSection} aria-label="Tactical Directives">
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
                type="button"
                className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.disabled ? styles.disabled : ''}`}
                onClick={() => {
                  if (!item.disabled) {
                    onSelectTab(item.id);
                    onCloseMobile?.();
                  }
                }}
                disabled={item.disabled}
                aria-disabled={item.disabled}
                aria-current={isActive ? 'page' : undefined}
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
    </>
  );
};
