import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { Footer } from '../components/common/Footer';
import { Dashboard } from '../pages/Dashboard';
import { EvidenceIntake } from '../pages/EvidenceIntake';
import { InvestigationTimeline } from '../pages/InvestigationTimeline';
import { InvestigationAnalysis } from '../pages/InvestigationAnalysis';
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
  const [activeEvidenceEvents, setActiveEvidenceEvents] = useState<LogEventCandidate[] | undefined>(undefined);
  const [activeTimelineEvents, setActiveTimelineEvents] = useState<TimelineEvent[] | undefined>(undefined);

  const handleNavigateToTimelineWithEvents = (events: LogEventCandidate[]) => {
    setActiveEvidenceEvents(events);
    setCurrentTab('investigation');
  };

  const handleNavigateToAnalysisWithEvents = (events: TimelineEvent[]) => {
    setActiveTimelineEvents(events);
    setCurrentTab('cases');
  };

  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.mainBody}>
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
        <main className={styles.mainContent}>
          <div className={styles.contentBody}>
            {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
            {currentTab === 'evidence' && (
              <EvidenceIntake
                onNavigateToTimeline={handleNavigateToTimelineWithEvents}
              />
            )}
            {currentTab === 'investigation' && (
              <InvestigationTimeline
                onNavigate={setCurrentTab}
                incomingEvents={activeEvidenceEvents}
                onNavigateToAnalysis={handleNavigateToAnalysisWithEvents}
              />
            )}
            {currentTab === 'cases' && (
              <InvestigationAnalysis
                onNavigate={setCurrentTab}
                availableTimelineEvents={activeTimelineEvents}
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
