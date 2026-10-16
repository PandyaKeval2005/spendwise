import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { api } from '../api/client';
import { formatCurrency } from '../utils/currency';
import { formatMonthLabel } from '../utils/dates';
import { getCategoryIcon } from '../utils/categories';
import {
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  Target,
  Edit2,
  Save,
  Calendar,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const BudgetsPage: React.FC = () => {
  const { user } = useAuth();
  const { currentMonth, dashboardData, refreshDashboard, categories, refreshCategories } = useFinance();

  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState('');
  const [savingsGoalInput, setSavingsGoalInput] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingCategoryLimitId, setEditingCategoryLimitId] = useState<string | null>(null);
  const [categoryLimitInput, setCategoryLimitInput] = useState('');

  const currencySymbol = user?.currencySymbol || '₹';
  const budget = dashboardData?.budget;
  const summary = dashboardData?.summary;

  useEffect(() => {
    if (budget) {
      setMonthlyBudgetInput(String(budget.monthlyBudget || ''));
    }
  }, [budget]);

  // Days left in current month calculation
  const now = new Date();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, daysInCurrentMonth - currentDay);

  const budgetRemaining = budget?.budgetRemaining ?? 0;
  const recommendedDaily = budgetRemaining > 0 ? Math.round((budgetRemaining / daysRemaining) * 100) / 100 : 0;

  const handleSaveBudget = async () => {
    setLoading(true);
    try {
      const num = parseFloat(monthlyBudgetInput) || 0;
      await api.put(`/finances/month/${currentMonth}`, {
        monthlyBudget: num,
      });
      await refreshDashboard();
      setIsEditingBudget(false);
      try {
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      } catch {}
    } catch (err) {
      console.error('Failed to update budget:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategoryLimit = async (categoryId: string) => {
    try {
      const limit = parseFloat(categoryLimitInput) || 0;
      await api.put(`/categories/${categoryId}`, {
        budgetLimit: limit,
      });
      await refreshCategories();
      setEditingCategoryLimitId(null);
    } catch (err) {
      console.error('Failed to update category limit:', err);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Monthly Budgets & Savings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Spending limits and financial discipline for {formatMonthLabel(currentMonth)}
          </p>
        </div>
      </div>

      {/* Main Budget Hero Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Target Monthly Budget
              </span>
              {!isEditingBudget ? (
                <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 mt-0.5">
                  <span>{formatCurrency(budget?.monthlyBudget || 0, currencySymbol)}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingBudget(true)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Edit Monthly Budget"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={monthlyBudgetInput}
                    onChange={(e) => setMonthlyBudgetInput(e.target.value)}
                    placeholder="Enter monthly budget"
                    className="py-1 px-3 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl w-40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveBudget}
                    disabled={loading}
                    className="py-1.5 px-3 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingBudget(false)}
                    className="py-1.5 px-3 text-slate-600 text-xs font-bold hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Daily Spending Metric */}
          <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Suggested Daily Spend
              </span>
              <span className="text-sm font-extrabold text-emerald-950">
                {formatCurrency(recommendedDaily, currencySymbol)} / day
              </span>
              <span className="text-[10px] text-emerald-700/80 block">{daysRemaining} days left in month</span>
            </div>
          </div>
        </div>

        {/* Progress Bar & Details */}
        {budget && budget.monthlyBudget > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">
                Spent: {formatCurrency(budget.budgetSpent, currencySymbol)} ({budget.budgetUsedPercentage}%)
              </span>
              <span className={budget.isExceeded ? 'text-red-600' : 'text-emerald-700'}>
                Remaining: {formatCurrency(budget.budgetRemaining, currencySymbol)}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budget.isExceeded ? 'bg-red-500' : budget.isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budget.budgetUsedPercentage)}%` }}
              />
            </div>

            {/* Motivational message */}
            <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              budget.isExceeded
                ? 'bg-red-50 text-red-800'
                : budget.isWarning
                ? 'bg-amber-50 text-amber-800'
                : 'bg-emerald-50 text-emerald-800'
            }`}>
              {budget.isExceeded ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span className="font-semibold">
                {budget.isExceeded
                  ? 'Budget exceeded. Review high-spending categories below to trim unnecessary expenses.'
                  : budget.isWarning
                  ? 'Over 80% of budget utilized. Moderate non-essential spending for the rest of the month.'
                  : 'You are on track! Keep up this disciplined spending pace to maximize your savings this month.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Category-Specific Spending Limits */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>Category Spending Limits</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Set individual limits for dining, shopping, groceries, etc.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {expenseCategories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            // Calculate spent in this category
            const spentItem = dashboardData?.categoryBreakdown?.find((c) => c.categoryId === cat.id);
            const spentAmount = spentItem?.total || 0;
            const hasLimit = cat.budget_limit > 0;
            const percentage = hasLimit ? Math.round((spentAmount / cat.budget_limit) * 100) : 0;
            const isEditing = editingCategoryLimitId === cat.id;

            return (
              <div key={cat.id} className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color || '#059669' }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">{cat.name}</span>
                  </div>

                  {!isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">
                        {hasLimit ? formatCurrency(cat.budget_limit, currencySymbol, false) : 'No limit'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategoryLimitId(cat.id);
                          setCategoryLimitInput(String(cat.budget_limit || ''));
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
                        title="Set category limit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="Limit"
                        value={categoryLimitInput}
                        onChange={(e) => setCategoryLimitInput(e.target.value)}
                        className="w-20 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCategoryLimit(cat.id)}
                        className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        title="Save"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {hasLimit && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Spent: {formatCurrency(spentAmount, currencySymbol)}</span>
                      <span className={percentage > 100 ? 'text-red-600 font-bold' : 'text-slate-600 font-semibold'}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percentage > 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
