import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { Footer } from '../components/common/Footer';
import { Dashboard } from '../pages/Dashboard';
import { EvidenceIntake } from '../pages/EvidenceIntake';
import { InvestigationTimeline } from '../pages/InvestigationTimeline';
import { InvestigationAnalysis } from '../pages/InvestigationAnalysis';
import { CaseManagement } from '../pages/CaseManagement';
import { Reports } from '../pages/Reports';
import { readSavedCases, writeSavedCases, makeCaseId } from '../services/caseStorage';
import { InvestigationResponse, SavedInvestigationCase, AnalystFindingReview } from '../types';
import { NavSection, LogEventCandidate, TimelineEvent } from '../types';
import styles from './App.module.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavSection>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const mobileToggleRef = React.useRef<HTMLButtonElement>(null);
  const [activeEvidenceEvents, setActiveEvidenceEvents] = useState<LogEventCandidate[] | undefined>(undefined);
  const [activeTimelineEvents, setActiveTimelineEvents] = useState<TimelineEvent[] | undefined>(undefined);
  const [savedCases, setSavedCases] = useState<SavedInvestigationCase[]>(() => readSavedCases());
  const [reopenedCase, setReopenedCase] = useState<SavedInvestigationCase | null>(null);
  const [reportCase, setReportCase] = useState<SavedInvestigationCase | null>(null);

  const handleSelectTab = (tab: NavSection) => {
    setCurrentTab(tab);
    setIsMobileNavOpen(false);
  };

  const handleSaveCase = (
    analysis: InvestigationResponse,
    reviews: AnalystFindingReview[],
    caseName: string,
    analystNotes: string,
    existingCaseId?: string,
    timeline?: TimelineEvent[]
  ) => {
    const now = new Date().toISOString();
    const existing = existingCaseId ? savedCases.find(item => item.caseId === existingCaseId) : undefined;
    const record: SavedInvestigationCase = {
      caseId: existing?.caseId ?? makeCaseId(),
      caseName: caseName.trim() || `Linux investigation — ${new Date(now).toLocaleDateString()}`,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      verdict: analysis.verdict,
      totalEventsAnalyzed: analysis.total_events_analyzed,
      analysisMethod: analysis.analysis_method,
      originalAnalysis: analysis,
      reviews,
      analystNotes,
      timeline: timeline ?? existing?.timeline ?? activeTimelineEvents,
    };
    const next = existing ? savedCases.map(item => item.caseId === record.caseId ? record : item) : [record, ...savedCases];
    writeSavedCases(next);
    setSavedCases(next);
    setReopenedCase(record);
    setReportCase(record);
    handleSelectTab('cases');
  };

  const handleReopenCase = (record: SavedInvestigationCase) => {
    setReopenedCase(record);
    if (record.timeline && record.timeline.length > 0) {
      setActiveTimelineEvents(record.timeline);
    }
    handleSelectTab('cases');
  };

  const handleOpenReport = (record: SavedInvestigationCase) => {
    setReportCase(record);
    handleSelectTab('reports');
  };

  const handleNavigateToTimelineWithEvents = (events: LogEventCandidate[]) => {
    setActiveEvidenceEvents(events);
    handleSelectTab('investigation');
  };

  const handleNavigateToAnalysisWithEvents = (events: TimelineEvent[]) => {
    setActiveTimelineEvents(events);
    handleSelectTab('cases');
  };

  return (
    <div className={styles.layout}>
      <Header
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={() => setIsMobileNavOpen(prev => !prev)}
        mobileToggleRef={mobileToggleRef}
      />
      <div className={styles.mainBody}>
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          mobileToggleRef={mobileToggleRef}
        />
        <main className={styles.mainContent}>
          <div className={styles.contentBody}>
            {currentTab === 'dashboard' && <Dashboard onNavigate={handleSelectTab} />}
            {currentTab === 'evidence' && (
              <EvidenceIntake
                onNavigateToTimeline={handleNavigateToTimelineWithEvents}
              />
            )}
            {currentTab === 'investigation' && (
              <InvestigationTimeline
                onNavigate={handleSelectTab}
                incomingEvents={activeEvidenceEvents}
                onNavigateToAnalysis={handleNavigateToAnalysisWithEvents}
              />
            )}
            {currentTab === 'cases' && (
              <InvestigationAnalysis
                onNavigate={handleSelectTab}
                availableTimelineEvents={activeTimelineEvents}
                initialCase={reopenedCase}
                onSaveCase={handleSaveCase}
                onBackToCases={() => { setReopenedCase(null); handleSelectTab('case-management'); }}
                onOpenReport={handleOpenReport}
              />
            )}
            {currentTab === 'case-management' && (
              <CaseManagement
                cases={savedCases}
                onCasesChange={setSavedCases}
                onReopen={handleReopenCase}
                onOpenReport={handleOpenReport}
              />
            )}
            {currentTab === 'reports' && (
              <Reports
                cases={savedCases}
                activeCase={reportCase}
                activeTimelineEvents={activeTimelineEvents}
                onNavigate={handleSelectTab}
                onSelectCase={setReportCase}
              />
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
