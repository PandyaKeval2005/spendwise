import React from 'react';
import { formatCurrency } from '../../utils/currency';
import { PiggyBank, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface BudgetProgressCardProps {
  budget: {
    monthlyBudget: number;
    budgetSpent: number;
    budgetRemaining: number;
    budgetUsedPercentage: number;
    isExceeded: boolean;
    isWarning: boolean;
  };
  currencySymbol: string;
  onSetBudget?: () => void;
}

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  budget,
  currencySymbol,
  onSetBudget,
}) => {
  const hasBudget = budget.monthlyBudget > 0;

  if (!hasBudget) {
    return (
      <div className="bg-gradient-to-br from-white to-emerald-50/40 border border-emerald-100 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Set Monthly Spending Budget</h4>
            <p className="text-xs text-slate-500 mt-0.5">Control your expenses and prevent overspending</p>
          </div>
        </div>
        {onSetBudget && (
          <button
            type="button"
            onClick={onSetBudget}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <span>Set Budget</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Cap visual bar width to 100%
  const visualPercentage = Math.min(100, Math.max(0, budget.budgetUsedPercentage));

  let barColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-100 text-emerald-800';
  let statusMessage = "Great job! You're comfortably within your monthly budget.";

  if (budget.isExceeded) {
    barColor = 'bg-red-500';
    badgeColor = 'bg-red-100 text-red-800';
    statusMessage = 'Warning: You have exceeded your planned spending budget for this month.';
  } else if (budget.isWarning) {
    barColor = 'bg-amber-500';
    badgeColor = 'bg-amber-100 text-amber-800';
    statusMessage = 'Caution: You have utilized over 80% of your allocated monthly budget.';
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <PiggyBank className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900">Monthly Budget Progress</span>
        </div>
        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
          {budget.budgetUsedPercentage}% used
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${visualPercentage}%` }}
        />
      </div>

      {/* Figures Row */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Spent</span>
          <span className="font-extrabold text-slate-800">
            {formatCurrency(budget.budgetSpent, currencySymbol)}
          </span>
        </div>
        <div className="text-center">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining</span>
          <span className={`font-extrabold ${budget.isExceeded ? 'text-red-600' : 'text-emerald-700'}`}>
            {formatCurrency(budget.budgetRemaining, currencySymbol)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Budget</span>
          <span className="font-extrabold text-slate-800">
            {formatCurrency(budget.monthlyBudget, currencySymbol)}
          </span>
        </div>
      </div>

      {/* Motivational / Warning Feedback Banner */}
      <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
        budget.isExceeded
          ? 'bg-red-50 text-red-700'
          : budget.isWarning
          ? 'bg-amber-50 text-amber-800'
          : 'bg-emerald-50 text-emerald-800'
      }`}>
        {budget.isExceeded || budget.isWarning ? (
          <AlertTriangle className="w-4 h-4 shrink-0" />
        ) : (
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        )}
        <span className="text-[11px] font-medium leading-tight">{statusMessage}</span>
      </div>
    </div>
  );
};
