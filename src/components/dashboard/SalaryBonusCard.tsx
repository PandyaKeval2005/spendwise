import React from 'react';
import { formatCurrency } from '../../utils/currency';
import { Briefcase, Award, TrendingUp, Plus } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';

interface SalaryBonusCardProps {
  incomeBreakdown: {
    totalSalary: number;
    totalBonus: number;
    totalOtherIncome: number;
  };
  currencySymbol: string;
}

export const SalaryBonusCard: React.FC<SalaryBonusCardProps> = ({
  incomeBreakdown,
  currencySymbol,
}) => {
  const { openAddSalary, openAddIncome } = useFinance();

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>Salary & Earnings</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Income streams recorded for this month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Base Salary */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Base Salary</span>
            </div>
            <div className="text-base font-extrabold text-slate-900">
              {formatCurrency(incomeBreakdown.totalSalary, currencySymbol)}
            </div>
          </div>
          {incomeBreakdown.totalSalary === 0 && (
            <button
              type="button"
              onClick={openAddSalary}
              className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl transition-colors"
              title="Add Salary"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bonuses & Incentives */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
              <Award className="w-3.5 h-3.5 text-teal-600" />
              <span>Bonuses & Gifts</span>
            </div>
            <div className="text-base font-extrabold text-slate-900">
              {formatCurrency(incomeBreakdown.totalBonus, currencySymbol)}
            </div>
          </div>
          <button
            type="button"
            onClick={openAddIncome}
            className="p-1.5 bg-teal-100 text-teal-700 hover:bg-teal-200 rounded-xl transition-colors"
            title="Add Bonus"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Other Income */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Other Income</span>
            </div>
            <div className="text-base font-extrabold text-slate-900">
              {formatCurrency(incomeBreakdown.totalOtherIncome, currencySymbol)}
            </div>
          </div>
          <button
            type="button"
            onClick={openAddIncome}
            className="p-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl transition-colors"
            title="Add Other Income"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
