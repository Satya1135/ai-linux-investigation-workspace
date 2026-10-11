import React, { useState, useMemo } from 'react';
import {
  FileText,
  Cpu,
  FolderOpen,
  FolderSearch,
} from 'lucide-react';
import { SavedInvestigationCase, NavSection, TimelineEvent } from '../types';
import { buildReportData, downloadHtmlReport } from '../services/reportGenerator';
import { ReportView } from '../components/reports/ReportView';
import styles from './Reports.module.css';

interface ReportsProps {
  cases: SavedInvestigationCase[];
  activeCase?: SavedInvestigationCase | null;
  activeTimelineEvents?: TimelineEvent[];
  onNavigate: (tab: NavSection) => void;
  onSelectCase?: (record: SavedInvestigationCase) => void;
}

export const Reports: React.FC<ReportsProps> = ({
  cases,
  activeCase,
  activeTimelineEvents,
  onNavigate,
  onSelectCase,
}) => {
  // Available cases list: merge activeCase if not already in cases list
  const availableCases = useMemo(() => {
    if (!activeCase) return cases;
    const exists = cases.some((c) => c.caseId === activeCase.caseId);
    return exists ? cases : [activeCase, ...cases];
  }, [cases, activeCase]);

  // Selected case state
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => {
    if (activeCase) return activeCase.caseId;
    if (cases.length > 0) return cases[0].caseId;
    return null;
  });

  // Keep selectedCaseId synchronized if activeCase changes
  React.useEffect(() => {
    if (activeCase) {
      setSelectedCaseId(activeCase.caseId);
    } else if (!selectedCaseId && availableCases.length > 0) {
      setSelectedCaseId(availableCases[0].caseId);
    }
  }, [activeCase, availableCases, selectedCaseId]);

  // Currently resolved case object
  const currentCase = useMemo(() => {
    return availableCases.find((c) => c.caseId === selectedCaseId) || null;
  }, [availableCases, selectedCaseId]);

  // Build complete report data model
  const reportData = useMemo(() => {
    if (!currentCase) return null;
    return buildReportData(currentCase, activeTimelineEvents);
  }, [currentCase, activeTimelineEvents]);

  // Handlers
  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    if (reportData) {
      downloadHtmlReport(reportData);
    }
  };

  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(caseId);
    const target = availableCases.find((c) => c.caseId === caseId);
    if (target && onSelectCase) {
      onSelectCase(target);
    }
  };

  return (
    <div className={styles.page}>
      {/* Page Header (Hidden when printing) */}
      <header className={`${styles.header} no-print`} data-no-print="true">
        <div>
          <div className={styles.eyebrow}>// INCIDENT REPORTING / DAY 8</div>
          <h1>Investigation Reports & Artifacts</h1>
          <p>
            Generate, review, and export formal incident documentation and forensic summaries.
          </p>
        </div>

        {availableCases.length > 0 && (
          <div className={styles.casePickerArea}>
            <label className={styles.caseSelectLabel} htmlFor="case-selector">
              <FolderSearch size={15} color="var(--accent-cyan)" />
              <span>Active Case:</span>
            </label>
            <select
              id="case-selector"
              className={styles.caseSelect}
              value={selectedCaseId || ''}
              onChange={(e) => handleCaseChange(e.target.value)}
              aria-label="Select investigation case for report"
            >
              {availableCases.map((c) => (
                <option key={c.caseId} value={c.caseId}>
                  {c.caseId} — {c.caseName}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      {!reportData ? (
        <div className={styles.emptyState}>
          <FileText size={48} color="var(--text-muted)" />
          <h2>No Investigation Case Available</h2>
          <p>
            To generate an incident report, first run an investigation in the AI Analysis workspace
            or select an existing case from Saved Cases.
          </p>
          <div className={styles.emptyActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => onNavigate('cases')}
            >
              <Cpu size={15} />
              <span>Go to AI Analysis</span>
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => onNavigate('case-management')}
            >
              <FolderOpen size={15} />
              <span>View Saved Cases</span>
            </button>
          </div>
        </div>
      ) : (
        <ReportView
          reportData={reportData}
          onPrintPdf={handlePrintPdf}
          onDownloadHtml={handleDownloadHtml}
          onBack={() => onNavigate('case-management')}
        />
      )}
    </div>
  );
};
