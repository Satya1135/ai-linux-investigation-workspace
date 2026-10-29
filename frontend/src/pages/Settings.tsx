import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Server,
  Activity,
  Database,
  Download,
  Upload,
  Trash2,
  Shield,
  ShieldCheck,
  X,
  Compass,
  Type,
  Layout,
  Zap,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  AppSettings,
  SavedInvestigationCase,
  NavSection,
} from '../types';
import { API_BASE_URL, fetchHealth } from '../services/api';
import {
  writeSavedCases,
  isValidCase,
  exportCasesToJson,
} from '../services/caseStorage';
import { resetSettings } from '../services/settingsStorage';
import styles from './Settings.module.css';

interface SettingsProps {
  cases: SavedInvestigationCase[];
  onCasesChange: (cases: SavedInvestigationCase[]) => void;
  onClearAllCases: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onNavigate?: (tab: NavSection) => void;
}

type ConnectionStatus = 'IDLE' | 'CHECKING' | 'CONNECTED' | 'UNAVAILABLE';

export const Settings: React.FC<SettingsProps> = ({
  cases,
  onCasesChange,
  onClearAllCases,
  settings,
  onUpdateSettings,
}) => {
  // Feedback notice state
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Backend connection test state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('IDLE');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<string | null>(null);

  // Clear cases confirmation modal state
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    if (!isClearModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsClearModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClearModalOpen]);

  // Handler for setting changes
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
    setNotice({
      message: `Preference updated: ${String(key)} set to ${String(value)}. Saved automatically.`,
      type: 'success',
    });
  };

  // Handler for Reset Preferences
  const handleResetPreferences = () => {
    const defaults = resetSettings();
    onUpdateSettings(defaults);
    setNotice({
      message: 'All preferences have been restored to default values. Saved cases were preserved.',
      type: 'success',
    });
  };

  // Handler for Connection Test
  const handleTestConnection = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setConnectionStatus('CHECKING');
    setConnectionDetails(null);

    try {
      const response = await fetchHealth();
      const timestamp = new Date().toLocaleTimeString();
      setConnectionStatus('CONNECTED');
      setLastCheckTime(timestamp);
      setConnectionDetails(
        `Backend service online (HTTP 200). Status: "${response.status}". Name: ${response.name || 'FastAPI Workstation API'}.`
      );
      setNotice({
        message: `Backend connection verified at ${timestamp}. Service is reachable and responding.`,
        type: 'success',
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown connection error';
      setConnectionStatus('UNAVAILABLE');
      setConnectionDetails(errorMsg);
      setNotice({
        message: `Connection test failed: ${errorMsg}`,
        type: 'error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Handler for JSON Export
  const handleExportBackup = () => {
    try {
      exportCasesToJson(cases);
      setNotice({
        message: `Exported ${cases.length} saved case(s) as JSON backup successfully.`,
        type: 'success',
      });
    } catch (error: unknown) {
      setNotice({
        message: error instanceof Error ? error.message : 'Failed to export backup.',
        type: 'error',
      });
    }
  };

  // Handler for JSON Import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.trim()) {
          throw new Error('Imported backup file is empty.');
        }

        const parsed: unknown = JSON.parse(text);
        let candidateCases: unknown[] = [];

        if (Array.isArray(parsed)) {
          candidateCases = parsed;
        } else if (parsed && typeof parsed === 'object') {
          const container = parsed as Record<string, unknown>;
          if (Array.isArray(container.cases)) {
            candidateCases = container.cases;
          } else if (Array.isArray(container.savedCases)) {
            candidateCases = container.savedCases;
          } else {
            throw new Error('Invalid backup schema: file must contain a JSON array of cases or a "cases" property.');
          }
        } else {
          throw new Error('Invalid backup format: JSON must be an array or object.');
        }

        // Validate individual case records
        const validCandidates = candidateCases.filter(isValidCase);
        if (validCandidates.length === 0) {
          throw new Error('Backup contains no valid case records. Ensure the file was generated by this workstation.');
        }

        // De-duplicate within the imported file itself
        const uniqueImportedMap = new Map<string, SavedInvestigationCase>();
        validCandidates.forEach((c) => uniqueImportedMap.set(c.caseId, c));
        const uniqueImported = Array.from(uniqueImportedMap.values());

        // Compare against existing cases to prevent duplicate IDs from corrupting existing data
        const existingIds = new Set(cases.map((c) => c.caseId));
        const newCases = uniqueImported.filter((c) => !existingIds.has(c.caseId));
        const duplicateCount = uniqueImported.length - newCases.length;

        if (newCases.length === 0) {
          setNotice({
            message: `All ${uniqueImported.length} case(s) in the backup file already exist in your local workspace. No duplicate cases were imported.`,
            type: 'success',
          });
          return;
        }

        // Merge new cases without modifying existing records
        const combined = [...newCases, ...cases];
        writeSavedCases(combined);
        onCasesChange(combined);

        setNotice({
          message: `Successfully imported ${newCases.length} new case(s).${
            duplicateCount > 0 ? ` (${duplicateCount} duplicate case ID(s) skipped to prevent overwriting).` : ''
          }`,
          type: 'success',
        });
      } catch (error: unknown) {
        setNotice({
          message: error instanceof Error ? error.message : 'Failed to import backup.',
          type: 'error',
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setNotice({
        message: 'Could not read the selected backup file. Check file permissions.',
        type: 'error',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  // Handler for Confirming Clear All Cases
  const handleConfirmClearAll = () => {
    onClearAllCases();
    setIsClearModalOpen(false);
    setNotice({
      message: 'All saved cases have been permanently cleared from browser storage.',
      type: 'success',
    });
  };

  return (
    <section className={styles.page} aria-label="Settings and Preferences">
      {/* Header Banner */}
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>// SYSTEM CONFIGURATION // PREFERENCES</div>
          <h1>Workspace Settings</h1>
          <p>
            Manage analyst interface density, typography scale, automated intake preferences,
            backend telemetry connection, and local forensic case backup storage.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.saveIndicator} title="All preference updates persist immediately to browser localStorage">
            <CheckCircle2 size={14} />
            <span>AUTO-SAVED TO BROWSER</span>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles.secondaryBtn}`}
            onClick={handleResetPreferences}
            title="Restore default interface and investigation preferences without modifying saved cases"
          >
            <RotateCcw size={14} />
            <span>Reset Preferences</span>
          </button>
        </div>
      </header>

      {/* Dismissible Feedback Banner */}
      {notice && (
        <div
          className={`${styles.feedbackBanner} ${
            notice.type === 'error' ? styles.error : styles.success
          }`}
          role="status"
        >
          <div className={styles.feedbackContent}>
            {notice.type === 'error' ? (
              <AlertCircle size={16} className={styles.noticeIcon} />
            ) : (
              <CheckCircle2 size={16} className={styles.noticeIcon} />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            className={styles.dismissBtn}
            onClick={() => setNotice(null)}
            aria-label="Dismiss feedback message"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* SECTION 1: Appearance & Accessibility */}
      <section className={styles.section} aria-labelledby="heading-appearance">
        <div className={styles.sectionHeader}>
          <Sliders size={18} className={styles.sectionIcon} />
          <h2 id="heading-appearance">Appearance & Accessibility</h2>
        </div>

        <div className={styles.grid}>
          {/* Interface Density */}
          <article className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLabel}>
                <Layout size={16} color="var(--accent-cyan)" />
                <span>Interface Density</span>
              </div>
              <p className={styles.cardDescription}>
                Adjust vertical padding, header dimensions, and form control footprint for denser triage.
              </p>
            </div>
            <div className={styles.optionGroup} role="radiogroup" aria-label="Interface Density">
              <button
                type="button"
                role="radio"
                aria-checked={settings.density === 'standard'}
                className={`${styles.optionBtn} ${settings.density === 'standard' ? styles.active : ''}`}
                onClick={() => updateSetting('density', 'standard')}
              >
                <span className={styles.optionTitle}>Standard</span>
                <span className={styles.optionSub}>Comfortable spacing & 68px header</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={settings.density === 'compact'}
                className={`${styles.optionBtn} ${settings.density === 'compact' ? styles.active : ''}`}
                onClick={() => updateSetting('density', 'compact')}
              >
                <span className={styles.optionTitle}>Compact</span>
                <span className={styles.optionSub}>Tight padding & 56px condensed header</span>
              </button>
            </div>
          </article>

          {/* Reduced Motion */}
          <article className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLabel}>
                <Zap size={16} color="var(--accent-cyan)" />
                <span>Motion & Transitions</span>
              </div>
              <p className={styles.cardDescription}>
                Control tactical pulse animations, radar sweeps, and interface transition durations.
              </p>
            </div>
            <div className={styles.optionGroup} role="radiogroup" aria-label="Motion & Transitions">
              <button
                type="button"
                role="radio"
                aria-checked={!settings.reducedMotion}
                className={`${styles.optionBtn} ${!settings.reducedMotion ? styles.active : ''}`}
                onClick={() => updateSetting('reducedMotion', false)}
              >
                <span className={styles.optionTitle}>Standard Motion</span>
                <span className={styles.optionSub}>Tactical pulses and transitions active</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={settings.reducedMotion}
                className={`${styles.optionBtn} ${settings.reducedMotion ? styles.active : ''}`}
                onClick={() => updateSetting('reducedMotion', true)}
              >
                <span className={styles.optionTitle}>Reduced Motion</span>
                <span className={styles.optionSub}>Immediate display, transitions suppressed</span>
              </button>
            </div>
          </article>

          {/* Interface Text Size */}
          <article className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLabel}>
                <Type size={16} color="var(--accent-cyan)" />
                <span>Interface Text Size</span>
              </div>
              <p className={styles.cardDescription}>
                Scale base typography across HUD metrics, evidence logs, and report tables.
              </p>
            </div>
            <div className={styles.optionGroup} role="radiogroup" aria-label="Interface Text Size">
              <button
                type="button"
                role="radio"
                aria-checked={settings.textSize === 'standard'}
                className={`${styles.optionBtn} ${settings.textSize === 'standard' ? styles.active : ''}`}
                onClick={() => updateSetting('textSize', 'standard')}
              >
                <span className={styles.optionTitle}>Standard (14px)</span>
                <span className={styles.optionSub}>Default high-contrast cybersecurity typography</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={settings.textSize === 'large'}
                className={`${styles.optionBtn} ${settings.textSize === 'large' ? styles.active : ''}`}
                onClick={() => updateSetting('textSize', 'large')}
              >
                <span className={styles.optionTitle}>Large (16px)</span>
                <span className={styles.optionSub}>Enhanced legibility for extended triage shifts</span>
              </button>
            </div>
          </article>
        </div>

        <div className={styles.noticeBox}>
          <Shield size={16} className={styles.noticeIcon} />
          <div>
            <strong>Tactical Dark Theme Active:</strong> The workstation operates exclusively with the
            high-contrast dark cybersecurity HUD theme (slate-black background with cyan, emerald, and rose telemetry accents).
            Light theme is not active to prevent eye fatigue during low-light SOC operations.
          </div>
        </div>
      </section>

      {/* SECTION 2: Investigation Preferences */}
      <section className={styles.section} aria-labelledby="heading-investigation-prefs">
        <div className={styles.sectionHeader}>
          <Compass size={18} className={styles.sectionIcon} />
          <h2 id="heading-investigation-prefs">Investigation Preferences</h2>
        </div>

        <div className={styles.grid}>
          {/* Default Landing Page */}
          <article className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLabel}>
                <span>Default Landing Directive</span>
              </div>
              <p className={styles.cardDescription}>
                Determines which directive opens automatically when beginning a new browser session.
              </p>
            </div>
            <div className={styles.optionGroup} role="radiogroup" aria-label="Default Landing Directive">
              <button
                type="button"
                role="radio"
                aria-checked={settings.defaultLandingPage === 'dashboard'}
                className={`${styles.optionBtn} ${settings.defaultLandingPage === 'dashboard' ? styles.active : ''}`}
                onClick={() => updateSetting('defaultLandingPage', 'dashboard')}
              >
                <span className={styles.optionTitle}>Dashboard</span>
                <span className={styles.optionSub}>Executive metrics HUD & quick actions</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={settings.defaultLandingPage === 'evidence'}
                className={`${styles.optionBtn} ${settings.defaultLandingPage === 'evidence' ? styles.active : ''}`}
                onClick={() => updateSetting('defaultLandingPage', 'evidence')}
              >
                <span className={styles.optionTitle}>Evidence Intake</span>
                <span className={styles.optionSub}>Direct jump to log upload & scenario triage</span>
              </button>
            </div>
          </article>

          {/* Preferred Intake Mode */}
          <article className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardLabel}>
                <span>Initial Evidence Intake Method</span>
              </div>
              <p className={styles.cardDescription}>
                Sets the active sub-tab whenever you navigate to the Evidence Intake directive.
              </p>
            </div>
            <div className={styles.optionGroup} role="radiogroup" aria-label="Initial Evidence Intake Method">
              <button
                type="button"
                role="radio"
                aria-checked={settings.defaultIntakeMode === 'sample'}
                className={`${styles.optionBtn} ${settings.defaultIntakeMode === 'sample' ? styles.active : ''}`}
                onClick={() => updateSetting('defaultIntakeMode', 'sample')}
              >
                <span className={styles.optionTitle}>Sample Scenario</span>
                <span className={styles.optionSub}>Pre-loaded 30-event Linux attack sequence</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={settings.defaultIntakeMode === 'upload'}
                className={`${styles.optionBtn} ${settings.defaultIntakeMode === 'upload' ? styles.active : ''}`}
                onClick={() => updateSetting('defaultIntakeMode', 'upload')}
              >
                <span className={styles.optionTitle}>File Upload</span>
                <span className={styles.optionSub}>Local .log / .txt forensic file selector</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={settings.defaultIntakeMode === 'paste'}
                className={`${styles.optionBtn} ${settings.defaultIntakeMode === 'paste' ? styles.active : ''}`}
                onClick={() => updateSetting('defaultIntakeMode', 'paste')}
              >
                <span className={styles.optionTitle}>Buffer Paste</span>
                <span className={styles.optionSub}>Direct raw syslog/auth.log clipboard paste</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* SECTION 3: Backend Connection */}
      <section className={styles.section} aria-labelledby="heading-backend">
        <div className={styles.sectionHeader}>
          <Server size={18} className={styles.sectionIcon} />
          <h2 id="heading-backend">Backend Telemetry & API Connection</h2>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.cardLabel}>
              <Activity size={16} color="var(--accent-cyan)" />
              <span>FastAPI Service Endpoint Health</span>
            </div>
            <p className={styles.cardDescription}>
              Inspect the configured API endpoint and test reachability of the local Linux investigation microservice.
            </p>
          </div>

          <div className={styles.connectionMeta}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>CONFIGURED API BASE URL:</span>
              <span className={styles.urlCode}>{API_BASE_URL}</span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>CONNECTION STATUS:</span>
              <span
                className={`${styles.statusBadge} ${
                  connectionStatus === 'CONNECTED'
                    ? styles.connected
                    : connectionStatus === 'UNAVAILABLE'
                    ? styles.unavailable
                    : connectionStatus === 'CHECKING'
                    ? styles.checking
                    : styles.idle
                }`}
              >
                {connectionStatus === 'CHECKING' && <Loader2 size={12} className={styles.spinner} />}
                {connectionStatus === 'CONNECTED' && <CheckCircle2 size={12} />}
                {connectionStatus === 'UNAVAILABLE' && <AlertCircle size={12} />}
                <span>
                  {connectionStatus === 'IDLE'
                    ? 'READY TO TEST'
                    : connectionStatus === 'CHECKING'
                    ? 'TESTING...'
                    : connectionStatus === 'CONNECTED'
                    ? 'CONNECTED (HTTP 200)'
                    : 'UNAVAILABLE'}
                </span>
              </span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>LAST SESSION CHECK:</span>
              <span className={styles.metaValue}>{lastCheckTime || 'Not tested in this session'}</span>
            </div>

            {connectionDetails && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>DIAGNOSTIC DETAILS:</span>
                <span className={styles.metaValue}>{connectionDetails}</span>
              </div>
            )}
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.btn} ${styles.primaryBtn}`}
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 size={14} className={styles.spinner} />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Activity size={14} />
                  <span>Test Backend Connection</span>
                </>
              )}
            </button>
          </div>

          <div className={styles.noticeBox}>
            <ShieldCheck size={16} className={styles.noticeIcon} />
            <div>
              <strong>Deterministic Detection Engine Notice:</strong> Threat detections in this workspace execute
              using a 5-stage deterministic heuristic rule correlation engine (evaluating SUID backdoors, GTFOBins,
              credential theft, and persistence staging). Testing connection verifies local FastAPI availability on{' '}
              <code>{API_BASE_URL}</code>. The detection engine runs 100% locally on-node without live external Claude API calls.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Data, Storage & Privacy */}
      <section className={styles.section} aria-labelledby="heading-data-privacy">
        <div className={styles.sectionHeader}>
          <Database size={18} className={styles.sectionIcon} />
          <h2 id="heading-data-privacy">Data Storage & Case Management</h2>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.cardLabel}>
              <Database size={16} color="var(--accent-cyan)" />
              <span>Browser-Local Forensic Case Records</span>
            </div>
            <p className={styles.cardDescription}>
              Manage offline case persistence. Export full JSON case backups, restore historical cases,
              or purge records from your workstation profile.
            </p>
          </div>

          <div className={styles.storageStats}>
            <div className={styles.storageStatItem}>
              <span className={styles.statValue}>{cases.length}</span>
              <span className={styles.statLabel}>Saved Cases in Local Storage</span>
            </div>
            <div className={styles.storageStatItem}>
              <span className={styles.metaLabel}>STORAGE ENGINE:</span>
              <span className={styles.metaValue}>localStorage (v1)</span>
            </div>
          </div>

          <div className={styles.noticeBox}>
            <ShieldCheck size={16} className={styles.noticeIcon} />
            <div>
              <strong>Strict Local Privacy Guarantee:</strong> Saved case records, findings, analyst notes, and raw evidence
              remain exclusively within your local browser profile. No investigation logs or case data are ever transmitted
              to external telemetry endpoints or third-party cloud infrastructure.
            </div>
          </div>

          <div className={`${styles.noticeBox} ${styles.warning}`}>
            <AlertTriangle size={16} className={styles.noticeIcon} />
            <div>
              <strong>Browser Storage Persistence Warning:</strong> Because cases are stored in your browser's local profile,
              clearing site cookies, browsing data, or using an incognito session will permanently delete stored cases.
              Export regular JSON backups to archive your forensic findings securely on disk.
            </div>
          </div>

          {/* Hidden File Input for JSON Backup Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json,application/json"
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.btn} ${styles.secondaryBtn}`}
              onClick={handleExportBackup}
              disabled={cases.length === 0}
              title={cases.length === 0 ? 'No saved cases to export' : 'Export all saved cases to a timestamped JSON file'}
            >
              <Download size={14} />
              <span>Export Cases Backup (.json)</span>
            </button>

            <button
              type="button"
              className={`${styles.btn} ${styles.secondaryBtn}`}
              onClick={() => fileInputRef.current?.click()}
              title="Import cases from a previously exported JSON backup"
            >
              <Upload size={14} />
              <span>Import Cases Backup (.json)</span>
            </button>

            <button
              type="button"
              className={`${styles.btn} ${styles.dangerBtn}`}
              onClick={() => setIsClearModalOpen(true)}
              disabled={cases.length === 0}
              title={cases.length === 0 ? 'No saved cases to clear' : 'Permanently remove all cases from local storage'}
            >
              <Trash2 size={14} />
              <span>Clear All Saved Cases</span>
            </button>
          </div>
        </div>
      </section>

      {/* Confirmation Modal for Clear All Saved Cases */}
      {isClearModalOpen && (
        <div
          className={styles.overlay}
          role="presentation"
          onClick={() => setIsClearModalOpen(false)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-cases-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <h2 id="clear-cases-modal-title">
                <AlertTriangle size={18} />
                <span>Confirm Case Data Purge</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p>
                Are you sure you want to permanently delete all <strong>{cases.length} saved case(s)</strong> from
                browser local storage?
              </p>
              <div className={`${styles.noticeBox} ${styles.danger}`}>
                <AlertTriangle size={16} className={styles.noticeIcon} />
                <div>
                  <strong>Irreversible Action:</strong> This will delete all forensic findings, analyst reviews, notes, and
                  timelines saved in this browser. Any active case currently reopened in the Analysis or Report tabs
                  will also be detached.
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.secondaryBtn}`}
                onClick={() => setIsClearModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.dangerBtn}`}
                onClick={handleConfirmClearAll}
              >
                <Trash2 size={14} />
                <span>Permanently Delete All Cases</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
