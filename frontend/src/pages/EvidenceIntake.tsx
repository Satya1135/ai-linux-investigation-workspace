import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import {
  EvidenceResponse,
  EvidenceSourceType,
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

export const EvidenceIntake: React.FC = () => {
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
  const [isOriginalExpanded, setIsOriginalExpanded] = useState<boolean>(false);
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

  // Filter candidates for display
  const filteredEvents = evidence?.normalized_events.filter((item) => {
    if (!eventSearchQuery.trim()) return true;
    const q = eventSearchQuery.toLowerCase();
    return (
      item.raw_message.toLowerCase().includes(q) ||
      (item.event_time && item.event_time.toLowerCase().includes(q)) ||
      String(item.event_index).includes(q)
    );
  }) || [];

  return (
    <div className={styles.container}>
      {/* 1. Page Heading & Description */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.heading}>Evidence Intake</h1>
          <p className={styles.subheading}>Add Linux security evidence for investigation.</p>
        </div>
        {evidence && (
          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={handleReset}
            title="Ingest another evidence file or text"
          >
            <RotateCcw size={14} />
            <span>Ingest New Evidence</span>
          </button>
        )}
      </div>

      {/* 2. Security Banner */}
      <div className={styles.securityBanner} role="alert">
        <ShieldAlert className={styles.securityIcon} size={22} />
        <div className={styles.securityContent}>
          <span className={styles.securityTitle}>Untrusted Text Data Boundary</span>
          <p className={styles.securityText}>
            Evidence is treated as text only. Commands, scripts, binaries, and files contained in logs are never executed.
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
      {/* INTAKE FORM (When evidence is not yet ingested)       */}
      {/* ==================================================== */}
      {!evidence && (
        <>
          {/* Mode Selector Cards */}
          <div className={styles.modeSelector}>
            {/* Mode 1: Sample */}
            <button
              type="button"
              className={`${styles.modeCard} ${selectedMode === 'sample' ? styles.selected : ''}`}
              onClick={() => {
                setSelectedMode('sample');
                resetError();
              }}
              disabled={isLoading}
            >
              <div className={styles.modeIconWrapper}>
                <FileCode size={22} />
              </div>
              <div className={styles.modeTitle}>Use Sample Scenario</div>
              <p className={styles.modeDesc}>
                Load the verified synthetic privilege escalation scenario from sample-data/linux/.
              </p>
              <span className={styles.modeBadge}>Synthetic Telemetry</span>
            </button>

            {/* Mode 2: Upload */}
            <button
              type="button"
              className={`${styles.modeCard} ${selectedMode === 'upload' ? styles.selected : ''}`}
              onClick={() => {
                setSelectedMode('upload');
                resetError();
              }}
              disabled={isLoading}
            >
              <div className={styles.modeIconWrapper}>
                <UploadCloud size={22} />
              </div>
              <div className={styles.modeTitle}>Upload .log / .txt</div>
              <p className={styles.modeDesc}>
                Upload an authentic raw log file (.log or .txt format, up to 5 MB).
              </p>
              <span className={styles.modeBadge}>.log / .txt &le; 5 MB</span>
            </button>

            {/* Mode 3: Paste */}
            <button
              type="button"
              className={`${styles.modeCard} ${selectedMode === 'paste' ? styles.selected : ''}`}
              onClick={() => {
                setSelectedMode('paste');
                resetError();
              }}
              disabled={isLoading}
            >
              <div className={styles.modeIconWrapper}>
                <ClipboardPaste size={22} />
              </div>
              <div className={styles.modeTitle}>Paste Linux Logs</div>
              <p className={styles.modeDesc}>
                Directly paste captured journalctl, auth.log, or syslog entries.
              </p>
              <span className={styles.modeBadge}>Direct Text Paste</span>
            </button>
          </div>

          {/* Active Intake Panel */}
          <div className={styles.panelContainer}>
            {isLoading ? (
              <div className={styles.loadingBox}>
                <Loader2 className={styles.spinIcon} size={28} />
                <span>{loadingMessage || 'Processing evidence...'}</span>
              </div>
            ) : (
              <>
                {/* 1. Sample Scenario Panel */}
                {selectedMode === 'sample' && (
                  <div className={styles.sampleDetails}>
                    <div className={styles.panelHeader}>
                      <span className={styles.panelTitle}>
                        <FileCode size={18} color="var(--accent-cyan)" />
                        Pre-Packaged Security Scenario
                      </span>
                    </div>

                    <div className={styles.scenarioCard}>
                      <span className={styles.scenarioName}>sample-privilege-escalation.log</span>
                      <p className={styles.scenarioDescription}>
                        Synthetic multi-stage Linux intrusion scenario featuring SSH brute force attempts, unauthorized
                        account login, sudo reconnaissance, curl staging, GTFOBins / find privilege escalation, and SUID
                        root shell persistence. Contains zero real secrets or credentials.
                      </p>
                      <div className={styles.scenarioTags}>
                        <span className={styles.scenarioTag}>SSH Auth</span>
                        <span className={styles.scenarioTag}>Sudo Recon</span>
                        <span className={styles.scenarioTag}>Curl Staging</span>
                        <span className={styles.scenarioTag}>GTFOBins / Find</span>
                        <span className={styles.scenarioTag}>SUID Persistence</span>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        className={styles.actionBtnPrimary}
                        onClick={handleLoadSample}
                        disabled={isLoading}
                      >
                        <FileCode size={16} />
                        <span>Load Sample Scenario</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Upload Panel */}
                {selectedMode === 'upload' && (
                  <div>
                    <div className={styles.panelHeader}>
                      <span className={styles.panelTitle}>
                        <UploadCloud size={18} color="var(--accent-cyan)" />
                        Select Evidence Log File
                      </span>
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
                      <UploadCloud className={styles.dropZoneIcon} size={40} />
                      <div className={styles.dropZonePrompt}>
                        {selectedFile ? 'Change Selected File' : 'Click to select or drag and drop a log file'}
                      </div>
                      <div className={styles.dropZoneSubtext}>
                        Supported formats: <strong>.log</strong>, <strong>.txt</strong> (Max size: 5 MB)
                      </div>
                    </div>

                    {selectedFile && (
                      <div className={styles.fileSelectedPreview}>
                        <div className={styles.fileInfo}>
                          <FileText size={18} color="var(--accent-cyan)" />
                          <span>{selectedFile.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>({formatByteSize(selectedFile.size)})</span>
                        </div>
                        <button
                          type="button"
                          className={styles.actionBtnPrimary}
                          onClick={handleUploadSubmit}
                          disabled={isLoading}
                        >
                          <UploadCloud size={16} />
                          <span>Validate & Ingest File</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Paste Panel */}
                {selectedMode === 'paste' && (
                  <form className={styles.pasteForm} onSubmit={handlePasteSubmit}>
                    <div className={styles.panelHeader}>
                      <span className={styles.panelTitle}>
                        <ClipboardPaste size={18} color="var(--accent-cyan)" />
                        Paste Linux Security Logs
                      </span>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="filename-input" className={styles.formLabel}>
                        Evidence Filename / Label (Optional)
                      </label>
                      <input
                        id="filename-input"
                        type="text"
                        className={styles.textInput}
                        placeholder="e.g. auth.log, syslog, incident_20261006.log"
                        value={pastedFilename}
                        onChange={(e) => setPastedFilename(e.target.value)}
                        maxLength={255}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="log-text-area" className={styles.formLabel}>
                        Raw Linux Log Content *
                      </label>
                      <textarea
                        id="log-text-area"
                        className={styles.logTextArea}
                        placeholder="Paste Linux security logs here..."
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        rows={12}
                        required
                        disabled={isLoading}
                      />
                      <div className={styles.pasteFooter}>
                        <span>Lines: {pastedText ? pastedText.split('\n').length : 0}</span>
                        <span>Size: {formatByteSize(new Blob([pastedText]).size)} / 5 MB</span>
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        className={styles.actionBtnPrimary}
                        disabled={isLoading || !pastedText.trim()}
                      >
                        <CheckCircle2 size={16} />
                        <span>Validate & Continue</span>
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ==================================================== */}
      {/* EVIDENCE PREVIEW (Shown after successful intake)     */}
      {/* ==================================================== */}
      {evidence && (
        <div className={styles.previewContainer}>
          {/* Summary / Metadata Card */}
          <div className={styles.previewHeaderCard}>
            <div className={styles.previewTopRow}>
              <div className={styles.previewTitleGroup}>
                <h2 className={styles.previewTitle}>Evidence Preview</h2>
                <span className={`${styles.sourceBadge} ${getSourceBadgeClass(evidence.source_type)}`}>
                  {evidence.source_type.toUpperCase()}
                </span>
                <span className={styles.validationBadge}>
                  <CheckCircle2 size={13} />
                  <span>{evidence.validation_status.toUpperCase()}</span>
                </span>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className={styles.metadataGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Source Type</span>
                <span className={styles.metaValue}>{evidence.source_type}</span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Filename</span>
                <span className={styles.metaValue}>{evidence.filename || 'Pasted Content'}</span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Byte Size</span>
                <span className={styles.metaValue}>{formatByteSize(evidence.byte_size)}</span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Candidate Events</span>
                <span className={styles.metaValue}>{evidence.event_count} events</span>
              </div>

              <div className={styles.metaItem} style={{ gridColumn: 'span 2' }}>
                <span className={styles.metaLabel}>SHA-256 Digest (Exact Raw Bytes)</span>
                <div className={styles.hashContainer}>
                  <span className={styles.hashText} title={evidence.original_content_sha256}>
                    {evidence.original_content_sha256}
                  </span>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(evidence.original_content_sha256, 'hash')}
                    title="Copy SHA-256 Hash"
                  >
                    {hasCopiedHash ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Events Viewer Card */}
          <div className={styles.eventsCard}>
            <div className={styles.eventsCardHeader}>
              <div className={styles.eventsTitleArea}>
                <span className={styles.eventsTitle}>Normalized Event Candidates</span>
                <span className={styles.eventCountBadge}>
                  {filteredEvents.length} of {evidence.event_count}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Filter candidate messages..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.eventsTableWrapper}>
              <table className={styles.eventsTable}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th style={{ width: '180px' }}>Timestamp</th>
                    <th>Raw Message (Untrusted Text)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((evt) => (
                    <tr key={evt.event_index}>
                      <td className={styles.indexCell}>{evt.event_index}</td>
                      <td className={styles.timeCell}>
                        {evt.event_time ? (
                          evt.event_time
                        ) : (
                          <span className={styles.noTime}>No timestamp</span>
                        )}
                      </td>
                      <td className={styles.messageCell}>
                        <code>{evt.raw_message}</code>
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No events match the search query "{eventSearchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Original Evidence (Safely rendered text) */}
          <div className={styles.originalSection}>
            <div
              className={styles.originalHeader}
              onClick={() => setIsOriginalExpanded(!isOriginalExpanded)}
            >
              <span className={styles.originalTitle}>
                <FileText size={18} color="var(--accent-cyan)" />
                Original Evidence (Verbatim Text)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(evidence.original_content, 'raw');
                  }}
                  title="Copy raw verbatim evidence text"
                >
                  {hasCopiedRaw ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  <span>{hasCopiedRaw ? 'Copied!' : 'Copy Raw Text'}</span>
                </button>
                {isOriginalExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {isOriginalExpanded && (
              <div className={styles.originalBody}>
                {/* SAFE TEXT RENDERING ONLY: React renders text nodes with no HTML evaluation */}
                <pre className={styles.originalPre}>{evidence.original_content}</pre>
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className={styles.bottomActions}>
            <div className={styles.statusMessage}>
              <CheckCircle2 size={16} />
              <span>Evidence normalized and validated. Ready for subsequent milestone analysis.</span>
            </div>
            <button
              type="button"
              className={styles.actionBtnSecondary}
              onClick={handleReset}
            >
              <RotateCcw size={14} />
              <span>Ingest Different Evidence</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
