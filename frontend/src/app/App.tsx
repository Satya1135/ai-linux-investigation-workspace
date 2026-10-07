import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { Dashboard } from '../pages/Dashboard';
import { EvidenceIntake } from '../pages/EvidenceIntake';
import { CasesPlaceholder } from '../components/cases/CasesPlaceholder';
import { NavSection } from '../types';
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

  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.mainBody}>
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
        <main className={styles.mainContent}>
          {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
          {currentTab === 'evidence' && <EvidenceIntake />}
          {currentTab === 'cases' && (
            <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
              <CasesPlaceholder />
            </div>
          )}
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
