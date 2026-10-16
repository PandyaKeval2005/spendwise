import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { AvailableBalanceCard } from '../components/dashboard/AvailableBalanceCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { BudgetProgressCard } from '../components/dashboard/BudgetProgressCard';
import { SpendingTrendChart } from '../components/dashboard/SpendingTrendChart';
import { CategoryBreakdownChart } from '../components/dashboard/CategoryBreakdownChart';
import { SalaryBonusCard } from '../components/dashboard/SalaryBonusCard';
import { RecentTransactionsList } from '../components/dashboard/RecentTransactionsList';
import { EmptyState } from '../components/common/EmptyState';
import { Sparkles, Plus, Briefcase, RefreshCw } from 'lucide-react';

interface DashboardPageProps {
  onSelectTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectTab }) => {
  const { user } = useAuth();
  const {
    currentMonth,
    dashboardData,
    loadingDashboard,
    refreshDashboard,
    openAddExpense,
    openAddSalary,
  } = useFinance();

  const currencySymbol = user?.currencySymbol || '₹';

  if (loadingDashboard && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-xs font-semibold">Updating financial ledger...</p>
      </div>
    );
  }

  const isBrandNew = !dashboardData || (
    dashboardData.summary.totalIncome === 0 &&
    dashboardData.summary.totalExpenses === 0 &&
    dashboardData.recentTransactions.length === 0
  );

  return (
    <div className="space-y-6">
      {/* 1. Hero Available Balance Card */}
      {dashboardData && (
        <AvailableBalanceCard
          summary={dashboardData.summary}
          month={currentMonth}
          currencySymbol={currencySymbol}
        />
      )}

      {/* 2. Quick Action Buttons */}
      <QuickActions onSelectTab={onSelectTab} />

      {/* If brand new, show friendly guide empty state */}
      {isBrandNew ? (
        <EmptyState
          icon={Sparkles}
          title="Welcome to your new financial dashboard!"
          description="You haven't recorded any income or expenses for this month yet. Start by logging your salary or your first daily expense."
          actionLabel="+ Add First Expense"
          onAction={() => openAddExpense()}
          secondaryActionLabel="+ Record Monthly Salary"
          onSecondaryAction={openAddSalary}
        />
      ) : (
        <>
          {/* 3. Monthly Budget Progress Card */}
          {dashboardData && (
            <BudgetProgressCard
              budget={dashboardData.budget}
              currencySymbol={currencySymbol}
              onSetBudget={() => onSelectTab('budgets')}
            />
          )}

          {/* 4. Charts Section: Daily Spending Trend & Category Breakdown */}
          {dashboardData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SpendingTrendChart
                  data={dashboardData.dailyTrends}
                  currencySymbol={currencySymbol}
                  onSelectDay={() => onSelectTab('transactions')}
                />
              </div>
              <div className="lg:col-span-1">
                <CategoryBreakdownChart
                  categories={dashboardData.categoryBreakdown}
                  currencySymbol={currencySymbol}
                  totalExpenses={dashboardData.summary.totalExpenses}
                />
              </div>
            </div>
          )}

          {/* 5. Salary vs Bonus Breakdown & Recent Transactions */}
          {dashboardData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <SalaryBonusCard
                  incomeBreakdown={dashboardData.incomeBreakdown}
                  currencySymbol={currencySymbol}
                />
              </div>
              <div className="lg:col-span-2">
                <RecentTransactionsList
                  transactions={dashboardData.recentTransactions}
                  currencySymbol={currencySymbol}
                  onViewAll={() => onSelectTab('transactions')}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
