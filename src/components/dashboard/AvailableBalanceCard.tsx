import React from 'react';
import { PeriodSummary } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatMonthLabel } from '../../utils/dates';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Percent,
  Info,
} from 'lucide-react';

interface AvailableBalanceCardProps {
  summary: PeriodSummary;
  month: string;
  currencySymbol: string;
}

export const AvailableBalanceCard: React.FC<AvailableBalanceCardProps> = ({
  summary,
  month,
  currencySymbol,
}) => {
  const isHealthySavings = summary.incomeRemaining >= 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-emerald-950/15 border border-emerald-700/30">
      {/* Subtle geometric background patterns */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-20 -bottom-16 w-56 h-56 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300 border border-white/10">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200/90">
            Current Available Balance
          </span>
        </div>
        <div className="text-[11px] font-semibold bg-white/10 px-2.5 py-1 rounded-full text-emerald-100 border border-white/10">
          {formatMonthLabel(month)}
        </div>
      </div>

      {/* Primary Hero Figure */}
      <div className="mb-6 relative z-10">
        <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
          {formatCurrency(summary.availableBalance, currencySymbol)}
        </div>
        <p className="text-xs text-emerald-200/70 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3 inline" />
          <span>Includes opening balance + all confirmed net income to date</span>
        </p>
      </div>

      {/* Financial Snapshot Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-4 border-t border-white/10 relative z-10">
        {/* Total Income */}
        <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-semibold mb-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Total Income</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-white truncate">
            {formatCurrency(summary.totalIncome, currencySymbol)}
          </div>
          <span className="text-[10px] text-white/50 block mt-0.5">Salary & Earnings</span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-red-300 text-[11px] font-semibold mb-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Total Expenses</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-white truncate">
            {formatCurrency(summary.totalExpenses, currencySymbol)}
          </div>
          <span className="text-[10px] text-white/50 block mt-0.5">Spent this month</span>
        </div>

        {/* Income Remaining */}
        <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-teal-300 text-[11px] font-semibold mb-1">
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Income Left</span>
          </div>
          <div className={`text-base sm:text-lg font-extrabold truncate ${
            isHealthySavings ? 'text-white' : 'text-red-300'
          }`}>
            {formatCurrency(summary.incomeRemaining, currencySymbol)}
          </div>
          <span className="text-[10px] text-white/50 block mt-0.5">From this month alone</span>
        </div>

        {/* Spending Percentage */}
        <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-semibold mb-1">
            <Percent className="w-3.5 h-3.5" />
            <span>Spent Ratio</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-white truncate">
            {summary.spendingPercentage}%
          </div>
          <span className="text-[10px] text-white/50 block mt-0.5">
            Savings: {summary.savingsRate}%
          </span>
        </div>
      </div>
    </div>
  );
};
