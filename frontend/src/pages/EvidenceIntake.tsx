import React, { useState, useRef, useMemo } from 'react';
import {
  ShieldAlert,
  FileCode,
  UploadCloud,
  ClipboardPaste,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Search,
  FileText,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Lock,
  Shield,
  Terminal,
  Activity,
  ArrowRight,
  Database,
} from 'lucide-react';
import {
  EvidenceResponse,
  EvidenceSourceType,
  LogEventCandidate,
} from '../types';
import {
  loadSampleEvidence,
  uploadEvidence,
  pasteEvidence,
} from '../services/api';
import styles from './EvidenceIntake.module.css';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.log', '.txt'];

type IntakeMode = 'sample' | 'upload' | 'paste';

interface ParsedSocEvent {
  index: number;
  time: string;
  host: string;
  process: string;
  eventType: 'PRIVESC' | 'AUTH' | 'EXEC' | 'PROCESS' | 'FILE_ACCESS' | 'CRON' | 'SYSTEM';
  severity: 'critical' | 'high' | 'warning' | 'normal';
  message: string;
  raw: string;
}

interface EvidenceIntakeProps {
  onNavigateToTimeline?: (events: LogEventCandidate[]) => void;
}

export const EvidenceIntake: React.FC<EvidenceIntakeProps> = ({ onNavigateToTimeline }) => {
  const [selectedMode, setSelectedMode] = useState<IntakeMode>('sample');
  const [evidence, setEvidence] = useState<EvidenceResponse | null>(null);

  // Loading & error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Paste form state
  const [pastedText, setPastedText] = useState<string>('');
  const [pastedFilename, setPastedFilename] = useState<string>('');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Evidence preview state
  const [eventSearchQuery, setEventSearchQuery] = useState<string>('');
  const [isOriginalExpanded, setIsOriginalExpanded] = useState<boolean>(true);
  const [hasCopiedHash, setHasCopiedHash] = useState<boolean>(false);
  const [hasCopiedRaw, setHasCopiedRaw] = useState<boolean>(false);

  // ==========================================
  // HANDLERS
  // ==========================================

  const resetError = () => setErrorMessage(null);

  const handleReset = () => {
    setEvidence(null);
    setErrorMessage(null);
    setSelectedFile(null);
    setPastedText('');
    setPastedFilename('');
    setEventSearchQuery('');
  };

  /**
   * Flow 1: Use Sample Scenario
   */
  const handleLoadSample = async () => {
    resetError();
    setIsLoading(true);
    setLoadingMessage('Loading synthetic privilege escalation scenario from sample-data/linux/...');
    try {
      const data = await loadSampleEvidence('sample-privilege-escalation.log');
      setEvidence(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load sample scenario.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * Flow 2: File Upload Validation & Submission
   */
  const validateSelectedFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file extension (${ext || 'no extension'}). Only .log and .txt files are allowed.`;
    }
    if (file.size === 0) {
      return 'The selected file is empty (0 bytes). Please select a file with valid log contents.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return `File size exceeds the 5 MB limit (selected file is ${sizeMb} MB).`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetError();
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validationErr = validateSelectedFile(file);
      if (validationErr) {
        setErrorMessage(validationErr);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    resetError();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const validationErr = validateSelectedFile(file);
      if (validationErr) {
        setErrorMessage(validationErr);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a .log or .txt file to upload.');
      return;
    }
    const validationErr = validateSelectedFile(selectedFile);
    if (validationErr) {
      setErrorMessage(validationErr);
      return;
    }

    resetError();
    setIsLoading(true);
    setLoadingMessage(`Uploading and validating ${selectedFile.name}...`);
    try {
      const data = await uploadEvidence(selectedFile);
      setEvidence(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload evidence.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * Flow 3: Paste Linux Logs Submission
   */
  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();

    const trimmed = pastedText.trim();
    if (!trimmed) {
      setErrorMessage('Pasted evidence cannot be empty or whitespace-only.');
      return;
    }

    const byteLength = new Blob([trimmed]).size;
    if (byteLength > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (byteLength / (1024 * 1024)).toFixed(2);
      setErrorMessage(`Pasted content exceeds the 5 MB limit (${sizeMb} MB).`);
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Validating and normalizing pasted log evidence...');
    try {
      const data = await pasteEvidence(trimmed, pastedFilename || undefined);
      setEvidence(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to ingest pasted evidence.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * Helpers
   */
  const copyToClipboard = (text: string, type: 'hash' | 'raw') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setHasCopiedHash(true);
      setTimeout(() => setHasCopiedHash(false), 2000);
    } else {
      setHasCopiedRaw(true);
      setTimeout(() => setHasCopiedRaw(false), 2000);
    }
  };

  const formatByteSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB (${bytes.toLocaleString()} bytes)`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB (${bytes.toLocaleString()} bytes)`;
  };

  const getSourceBadgeClass = (source: EvidenceSourceType): string => {
    switch (source) {
      case 'sample':
        return styles.badgeSample;
      case 'upload':
        return styles.badgeUpload;
      case 'paste':
        return styles.badgePaste;
      default:
        return '';
    }
  };

  // SOC Event Parser for Enhanced Investigation Presentation
  const parseSocEvent = (evt: LogEventCandidate): ParsedSocEvent => {
    const raw = evt.raw_message;
    let time = evt.event_time || 'N/A';
    let host = 'srv-corp-lnx01';
    let process = 'system';
    let message = raw;
    let eventType: ParsedSocEvent['eventType'] = 'SYSTEM';
    let severity: ParsedSocEvent['severity'] = 'normal';

    // Standard Syslog / Auth / Audit parsing heuristics
    // e.g., Oct 06 08:35:10 srv-corp-lnx01 sshd[2104]: Failed password...
    const syslogMatch = raw.match(/^([A-Za-z]{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+([^\s]+)\s+([^:]+):\s*(.*)$/);
    if (syslogMatch) {
      time = syslogMatch[1];
      host = syslogMatch[2];
      process = syslogMatch[3];
      message = syslogMatch[4];
    }

    const lower = raw.toLowerCase();
    if (lower.includes('priv_escalation') || lower.includes('rootshell') || (lower.includes('sudo') && lower.includes('find'))) {
      eventType = 'PRIVESC';
      severity = 'critical';
    } else if (lower.includes('failed password') || lower.includes('invalid user') || lower.includes('unauthorized')) {
      eventType = 'AUTH';
      severity = 'high';
    } else if (lower.includes('accepted password') || lower.includes('session opened') || lower.includes('session closed')) {
      eventType = 'AUTH';
      severity = 'normal';
    } else if (lower.includes('curl') || lower.includes('chmod +x') || lower.includes('process_exec') || lower.includes('syscall=59')) {
      eventType = 'EXEC';
      severity = 'warning';
    } else if (lower.includes('file_perm_change') || lower.includes('file_access') || lower.includes('shadow')) {
      eventType = 'FILE_ACCESS';
      severity = lower.includes('shadow') ? 'high' : 'warning';
    } else if (lower.includes('cron')) {
      eventType = 'CRON';
      severity = 'normal';
    } else if (lower.includes('systemd') || lower.includes('apt-daily')) {
      eventType = 'SYSTEM';
      severity = 'normal';
    } else {
      eventType = 'PROCESS';
      severity = 'normal';
    }

    return {
      index: evt.event_index,
      time,
      host,
      process,
      eventType,
      severity,
      message,
      raw,
    };
  };

  const parsedEvents = useMemo(() => {
    if (!evidence) return [];
    return evidence.normalized_events.map(parseSocEvent);
  }, [evidence]);

  const filteredEvents = useMemo(() => {
    if (!eventSearchQuery.trim()) return parsedEvents;
    const q = eventSearchQuery.toLowerCase();
    return parsedEvents.filter(
      (e) =>
        e.raw.toLowerCase().includes(q) ||
        e.host.toLowerCase().includes(q) ||
        e.process.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q) ||
        String(e.index).includes(q)
    );
  }, [parsedEvents, eventSearchQuery]);

  return (
    <div className={styles.container}>
      {/* 1. Tactical Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div className={styles.headingRow}>
            <Terminal size={24} className={styles.titleIcon} />
            <h1 className={styles.heading}>EVIDENCE INTAKE</h1>
            <div className={styles.liveBadge}>
              <span className={styles.liveDot} />
              <span>LIVE</span>
            </div>
            <span className={styles.channelTag}>// CHANNEL: SOC_INTAKE_01</span>
          </div>
          <p className={styles.subheading}>
            Ingest, validate, and normalize Linux logs for investigation
          </p>
        </div>

        {evidence && (
          <button
            type="button"
            className={styles.tacticalBtnSecondary}
            onClick={handleReset}
            title="Ingest another evidence file or text"
          >
            <RotateCcw size={14} />
            <span>INGEST NEW EVIDENCE</span>
          </button>
        )}
      </div>

      {/* 2. Tactical Security Boundary Banner */}
      <div className={styles.securityBanner} role="alert">
        <div className={styles.securityIconBox}>
          <ShieldAlert size={20} className={styles.securityIcon} />
        </div>
        <div className={styles.securityContent}>
          <div className={styles.securityHeader}>
            <span className={styles.securityTitle}>UNTRUSTED TEXT DATA BOUNDARY</span>
            <span className={styles.securitySub}>ISOLATION ACTIVE</span>
          </div>
          <p className={styles.securityText}>
            Evidence is strictly ingested and parsed as inert text data. Commands, shell scripts, binaries, and system paths contained in logs are <strong>never executed</strong>.
          </p>
        </div>
      </div>

      {/* 3. Error Banner */}
      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <div className={styles.errorContent}>
            <AlertTriangle size={18} color="var(--accent-rose)" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className={styles.dismissButton}
            onClick={resetError}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* INTAKE MODES (Shown when no evidence is loaded)      */}
      {/* ==================================================== */}
      {!evidence && (
        <div className={styles.intakeWrapper}>
          {/* Mode Selector Cards */}
          <div className={styles.modeSelector}>
            {/* Mode 1: Sample Scenario (Primary Highlight) */}
            <button
              type="button"
              className={`${styles.modeCard} ${styles.primarySampleCard} ${selectedMode === 'sample' ? styles.selected : ''}`}
              onClick={() => {
                setSelectedMode('sample');
                resetError();
              }}
              disabled={isLoading}
            >
              <div className={styles.cornerAccentTL} />
              <div className={styles.cornerAccentBR} />
              <div className={styles.modeTopRow}>
                <div className={styles.modeIconWrapper}>
                  <FileCode size={20} />
                </div>
                <span className={styles.primaryBadge}>RECOMMENDED</span>
              </div>
              <div className={styles.modeTitle}>Sample Scenario</div>
              <p className={styles.modeDesc}>
                Pre-packaged multi-stage Linux privilege escalation incident from <code>sample-data/linux/</code>.
              </p>
              <div className={styles.modeCardFooter}>
                <span className={styles.modeTag}>30 Log Events</span>
                <span className={styles.cardActionHint}>Select Pathway &rarr;</span>
              </div>
            </button>

            {/* Mode 2: Upload Log File */}
            <button
              type="button"
              className={`${styles.modeCard} ${selectedMode === 'upload' ? styles.selected : ''}`}
              onClick={() => {
                setSelectedMode('upload');
                resetError();
              }}
              disabled={isLoading}
            >
              <div className={styles.cornerAccentTL} />
              <div className={styles.cornerAccentBR} />
              <div className={styles.modeTopRow}>
                <div className={styles.modeIconWrapper}>
                  <UploadCloud size={20} />
                </div>
                <span className={styles.modeBadge}>FILE IMPORT</span>
              </div>
              <div className={styles.modeTitle}>Upload Log File</div>
              <p className={styles.modeDesc}>
                Import an authentic raw Linux system log file (<code>.log</code> or <code>.txt</code> format up to 5 MB).
              </p>
              <div className={styles.modeCardFooter}>
                <span className={styles.modeTag}>Max 5 MB</span>
                <span className={styles.cardActionHint}>Select Pathway &rarr;</span>
              </div>
            </button>

            {/* Mode 3: Paste Linux Logs */}
            <button
              type="button"
              className={`${styles.modeCard} ${selectedMode === 'paste' ? styles.selected : ''}`}
              onClick={() => {
                setSelectedMode('paste');
                resetError();
              }}
              disabled={isLoading}
            >
              <div className={styles.cornerAccentTL} />
              <div className={styles.cornerAccentBR} />
              <div className={styles.modeTopRow}>
                <div className={styles.modeIconWrapper}>
                  <ClipboardPaste size={20} />
                </div>
                <span className={styles.modeBadge}>RAW BUFFER</span>
              </div>
              <div className={styles.modeTitle}>Paste Linux Logs</div>
              <p className={styles.modeDesc}>
                Directly paste captured <code>journalctl</code>, <code>auth.log</code>, or <code>syslog</code> output.
              </p>
              <div className={styles.modeCardFooter}>
                <span className={styles.modeTag}>Direct Text</span>
                <span className={styles.cardActionHint}>Select Pathway &rarr;</span>
              </div>
            </button>
          </div>

          {/* Active Intake Console Panel */}
          <div className={styles.panelContainer}>
            <div className={styles.panelCornerTL} />
            <div className={styles.panelCornerBR} />

            {isLoading ? (
              <div className={styles.loadingBox}>
                <Loader2 className={styles.spinIcon} size={32} />
                <div className={styles.loadingTextGroup}>
                  <span className={styles.loadingTitle}>VALIDATING & INGESTING EVIDENCE</span>
                  <span className={styles.loadingSubtitle}>{loadingMessage || 'Processing forensic telemetry stream...'}</span>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Sample Scenario Panel */}
                {selectedMode === 'sample' && (
                  <div className={styles.sampleDetails}>
                    <div className={styles.panelHeader}>
                      <div className={styles.panelTitle}>
                        <FileCode size={18} color="var(--accent-cyan)" />
                        <span>SAMPLE PRIVILEGE ESCALATION SCENARIO</span>
                      </div>
                      <span className={styles.panelSubtag}>SOURCE: sample-privilege-escalation.log</span>
                    </div>

                    <div className={styles.scenarioCard}>
                      <div className={styles.scenarioTop}>
                        <span className={styles.scenarioName}>sample-privilege-escalation.log</span>
                        <span className={styles.scenarioSizeTag}>30 VERIFIED EVENTS</span>
                      </div>
                      <p className={styles.scenarioDescription}>
                        Authentic multi-stage Linux forensic scenario: SSH brute-force enumeration, credential compromise, unauthorized login, sudo reconnaissance, curl staging, GTFOBins / find privilege escalation to root, and SUID persistence shell installation.
                      </p>
                      <div className={styles.scenarioTags}>
                        <span className={styles.scenarioTag}>SSH_BRUTEFORCE</span>
                        <span className={styles.scenarioTag}>AUTH_BYPASS</span>
                        <span className={styles.scenarioTag}>SUDO_RECON</span>
                        <span className={styles.scenarioTag}>CURL_STAGING</span>
                        <span className={styles.scenarioTag}>GTFOBINS_FIND</span>
                        <span className={styles.scenarioTag}>SUID_PERSISTENCE</span>
                      </div>
                    </div>

                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        className={styles.tacticalBtnPrimary}
                        onClick={handleLoadSample}
                        disabled={isLoading}
                      >
                        <FileCode size={16} />
                        <span>USE SAMPLE SCENARIO</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Upload Panel */}
                {selectedMode === 'upload' && (
                  <div>
                    <div className={styles.panelHeader}>
                      <div className={styles.panelTitle}>
                        <UploadCloud size={18} color="var(--accent-cyan)" />
                        <span>FORENSIC LOG FILE IMPORT</span>
                      </div>
                      <span className={styles.panelSubtag}>ACCEPTED: .log, .txt (&le; 5 MB)</span>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".log,.txt"
                      className={styles.fileInputHidden}
                      onChange={handleFileChange}
                    />

                    <div
                      className={`${styles.dropZone} ${isDragActive ? styles.dragActive : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragActive(true);
                      }}
                      onDragLeave={() => setIsDragActive(false)}
                      onDrop={handleDrop}
                    >
                      <div className={styles.dropZoneIconBox}>
                        <UploadCloud className={styles.dropZoneIcon} size={36} />
                      </div>
                      <div className={styles.dropZonePrompt}>
                        {selectedFile ? 'CHANGE SELECTED EVIDENCE FILE' : 'CLICK TO SELECT OR DRAG EVIDENCE LOG'}
                      </div>
                      <div className={styles.dropZoneSubtext}>
                        SUPPORTED TYPES: <strong>.LOG</strong>, <strong>.TXT</strong> (MAXIMUM FILE SIZE: 5 MB)
                      </div>
                    </div>

                    {selectedFile && (
                      <div className={styles.fileSelectedPreview}>
                        <div className={styles.fileInfo}>
                          <FileText size={18} color="var(--accent-cyan)" />
                          <span className={styles.fileNameText}>{selectedFile.name}</span>
                          <span className={styles.fileSizeText}>({formatByteSize(selectedFile.size)})</span>
                        </div>
                        <button
                          type="button"
                          className={styles.tacticalBtnPrimary}
                          onClick={handleUploadSubmit}
                          disabled={isLoading}
                        >
                          <UploadCloud size={16} />
                          <span>VALIDATE & INGEST FILE</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Paste Panel */}
                {selectedMode === 'paste' && (
                  <form className={styles.pasteForm} onSubmit={handlePasteSubmit}>
                    <div className={styles.panelHeader}>
                      <div className={styles.panelTitle}>
                        <ClipboardPaste size={18} color="var(--accent-cyan)" />
                        <span>PASTE RAW LINUX LOG ENTRIES</span>
                      </div>
                      <span className={styles.panelSubtag}>DIRECT CAPTURE INTAKE</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="filename-input" className={styles.formLabel}>
                        // EVIDENCE LABEL / FILENAME (OPTIONAL)
                      </label>
                      <input
                        id="filename-input"
                        type="text"
                        className={styles.textInput}
                        placeholder="e.g. auth.log, syslog, incident_20261008.log"
                        value={pastedFilename}
                        onChange={(e) => setPastedFilename(e.target.value)}
                        maxLength={255}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="log-text-area" className={styles.formLabel}>
                        // RAW LINUX LOG CONTENT *
                      </label>
                      <textarea
                        id="log-text-area"
                        className={styles.logTextArea}
                        placeholder="Paste Linux security logs (auth.log, syslog, journalctl)..."
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        rows={12}
                        required
                        disabled={isLoading}
                      />
                      <div className={styles.pasteFooter}>
                        <span>LINES: {pastedText ? pastedText.split('\n').length : 0}</span>
                        <span>BUFFER SIZE: {formatByteSize(new Blob([pastedText]).size)} / 5 MB</span>
                      </div>
                    </div>

                    <div className={styles.actionRow}>
                      <button
                        type="submit"
                        className={styles.tacticalBtnPrimary}
                        disabled={isLoading || !pastedText.trim()}
                      >
                        <CheckCircle2 size={16} />
                        <span>VALIDATE & INGEST LOGS</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* EVIDENCE PREVIEW (Shown after successful intake)     */}
      {/* ==================================================== */}
      {evidence && (
        <div className={styles.previewContainer}>
          {/* Digital Forensics Evidence Metadata & Integrity Card */}
          <div className={styles.previewHeaderCard}>
            <div className={styles.previewTopRow}>
              <div className={styles.previewTitleGroup}>
                <Database size={20} color="var(--accent-cyan)" />
                <h2 className={styles.previewTitle}>EVIDENCE INTAKE SUMMARY</h2>
                <span className={`${styles.sourceBadge} ${getSourceBadgeClass(evidence.source_type)}`}>
                  {evidence.source_type.toUpperCase()}
                </span>
              </div>

              {/* Digital Forensics Integrity Area */}
              <div className={styles.integrityBox}>
                <div className={styles.integrityIcons}>
                  <Fingerprint size={16} color="var(--accent-cyan-bright)" />
                  <Shield size={16} color="var(--accent-emerald)" />
                  <Lock size={15} color="var(--accent-cyan)" />
                </div>
                <div className={styles.integrityTextGroup}>
                  <span className={styles.integrityTitle}>EVIDENCE INTEGRITY</span>
                  <span className={styles.integrityStatus}>VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Forensic Metadata Grid */}
            <div className={styles.metadataGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>EVIDENCE ID / SOURCE</span>
                <span className={styles.metaValue}>{evidence.source_type.toUpperCase()}</span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>FILENAME / LABEL</span>
                <span className={styles.metaValue}>{evidence.filename || 'Pasted Content'}</span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>EXACT BYTE SIZE</span>
                <span className={styles.metaValue}>{formatByteSize(evidence.byte_size)}</span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>NORMALIZED EVENTS</span>
                <span className={styles.metaValueHighlight}>{evidence.event_count} Events</span>
              </div>

              <div className={styles.metaItemHash}>
                <span className={styles.metaLabel}>SHA-256 INTEGRITY DIGEST (EXACT BYTES)</span>
                <div className={styles.hashContainer}>
                  <code className={styles.hashText} title={evidence.original_content_sha256}>
                    {evidence.original_content_sha256}
                  </code>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(evidence.original_content_sha256, 'hash')}
                    title="Copy SHA-256 Hash"
                  >
                    {hasCopiedHash ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                    <span>{hasCopiedHash ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SOC Normalized Events Table Section */}
          <div className={styles.eventsCard}>
            <div className={styles.eventsCardHeader}>
              <div className={styles.eventsTitleArea}>
                <Activity size={18} color="var(--accent-cyan)" />
                <span className={styles.eventsTitle}>NORMALIZED EVENT CANDIDATES</span>
                <span className={styles.eventCountBadge}>
                  {filteredEvents.length} OF {evidence.event_count}
                </span>
              </div>

              <div className={styles.filterWrapper}>
                <Search size={14} color="var(--text-muted)" />
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Filter by keyword, process, host..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.eventsTableWrapper}>
              <table className={styles.eventsTable}>
                <thead>
                  <tr>
                    <th style={{ width: '45px' }}>#</th>
                    <th style={{ width: '135px' }}>TIMESTAMP</th>
                    <th style={{ width: '130px' }}>HOST</th>
                    <th style={{ width: '120px' }}>PROCESS</th>
                    <th style={{ width: '110px' }}>EVENT TYPE</th>
                    <th>RAW LOG MESSAGE (UNTRUSTED TEXT)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((evt) => (
                    <tr key={evt.index} className={evt.severity === 'critical' ? styles.rowCritical : undefined}>
                      <td className={styles.indexCell}>{evt.index}</td>
                      <td className={styles.timeCell}>{evt.time}</td>
                      <td className={styles.hostCell}>{evt.host}</td>
                      <td className={styles.processCell}>
                        <code>{evt.process}</code>
                      </td>
                      <td className={styles.badgeCell}>
                        <span className={`${styles.socBadge} ${styles['badge_' + evt.eventType.toLowerCase()] || styles.badge_system} ${styles['sev_' + evt.severity]}`}>
                          {evt.eventType}
                        </span>
                      </td>
                      <td className={styles.messageCell}>
                        <code>{evt.message}</code>
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} className={styles.emptyTable}>
                        No forensic events match search query "{eventSearchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Secure Forensic Raw Evidence Terminal */}
          <div className={styles.originalSection}>
            <div
              className={styles.originalHeader}
              onClick={() => setIsOriginalExpanded(!isOriginalExpanded)}
            >
              <div className={styles.originalTitle}>
                <Terminal size={18} color="var(--accent-cyan)" />
                <span>RAW EVIDENCE (ORIGINAL FORENSIC BUFFER)</span>
                <span className={styles.terminalBufferTag}>[READ_ONLY_BUFFER]</span>
              </div>
              <div className={styles.originalActions}>
                <button
                  type="button"
                  className={styles.tacticalBtnSecondary}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(evidence.original_content, 'raw');
                  }}
                  title="Copy raw verbatim evidence text"
                >
                  {hasCopiedRaw ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  <span>{hasCopiedRaw ? 'COPIED' : 'COPY RAW TEXT'}</span>
                </button>
                <div className={styles.expandIcon}>
                  {isOriginalExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
            </div>

            {isOriginalExpanded && (
              <div className={styles.originalBody}>
                {/* SAFE TEXT RENDERING ONLY: React renders text nodes with no HTML evaluation */}
                <div className={styles.terminalWindow}>
                  <div className={styles.terminalTopBar}>
                    <div className={styles.terminalDots}>
                      <span className={styles.termDotRed} />
                      <span className={styles.termDotYellow} />
                      <span className={styles.termDotGreen} />
                    </div>
                    <span className={styles.terminalTitle}>forensic_evidence_view :: sha256:{evidence.original_content_sha256.substring(0, 12)}...</span>
                  </div>
                  <pre className={styles.originalPre}>{evidence.original_content}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Tactical Action Bar */}
          <div className={styles.bottomActions}>
            <div className={styles.statusMessage}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span>Evidence validated, SHA-256 hashed, and normalized. Ready for downstream investigation.</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className={styles.tacticalBtnSecondary}
                onClick={handleReset}
              >
                <RotateCcw size={14} />
                <span>INGEST DIFFERENT EVIDENCE</span>
              </button>
              {onNavigateToTimeline && (
                <button
                  type="button"
                  className={styles.tacticalBtnPrimary}
                  onClick={() => onNavigateToTimeline(evidence.normalized_events)}
                >
                  <span>PROCEED TO TIMELINE</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
