import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { AuthPage } from './pages/AuthPage';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { IncomePage } from './pages/IncomePage';
import { ReportsPage } from './pages/ReportsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { SettingsPage } from './pages/SettingsPage';

// Global Modals
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { AddSalaryModal } from './components/modals/AddSalaryModal';
import { AddIncomeModal } from './components/modals/AddIncomeModal';
import { TransactionDetailModal } from './components/modals/TransactionDetailModal';
import { ExportReportModal } from './components/modals/ExportReportModal';

import { Wallet, RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-3xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/25 mb-4 animate-bounce">
          <Wallet className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-white">SpendWise</h2>
        <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Securing financial session...</span>
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!user.onboardingCompleted) {
    return <OnboardingWizard />;
  }

  return (
    <FinanceProvider>
      <AppLayout currentTab={currentTab} onSelectTab={setCurrentTab}>
        {currentTab === 'dashboard' && <DashboardPage onSelectTab={setCurrentTab} />}
        {currentTab === 'transactions' && <TransactionsPage />}
        {currentTab === 'income' && <IncomePage />}
        {currentTab === 'reports' && <ReportsPage />}
        {currentTab === 'budgets' && <BudgetsPage />}
        {currentTab === 'settings' && <SettingsPage />}
      </AppLayout>

      {/* Global Interactive Modals */}
      <AddExpenseModal />
      <AddSalaryModal />
      <AddIncomeModal />
      <TransactionDetailModal />
      <ExportReportModal />
    </FinanceProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
