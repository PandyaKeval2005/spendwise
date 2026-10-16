import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { api } from '../api/client';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDisplayDate, formatMonthLabel } from '../utils/dates';
import {
  Briefcase,
  Award,
  Plus,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Calendar,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const IncomePage: React.FC = () => {
  const { user } = useAuth();
  const { currentMonth, openAddSalary, openAddIncome, refreshDashboard } = useFinance();

  const [existingSalary, setExistingSalary] = useState<Transaction | null>(null);
  const [allIncome, setAllIncome] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const currencySymbol = user?.currencySymbol || '₹';

  const fetchMonthIncome = async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        month: string;
        income: Transaction[];
        existingSalary: Transaction | null;
      }>(`/income?month=${currentMonth}`);

      setAllIncome(res.income);
      setExistingSalary(res.existingSalary);
    } catch (err) {
      console.error('Failed to load income:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthIncome();
  }, [currentMonth]);

  const handleDeleteIncome = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/income/${deleteTargetId}`);
      await fetchMonthIncome();
      await refreshDashboard();
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Failed to delete income:', err);
    }
  };

  // Group into Salary vs Other Earnings
  const salaryRecords = allIncome.filter((i) => i.income_type === 'salary');
  const bonusAndOtherRecords = allIncome.filter((i) => i.income_type !== 'salary');

  const totalMonthIncome = allIncome.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Salary & Income Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your monthly salary, incentives, freelance earnings, and bonuses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddIncome}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Bonus / Other</span>
          </button>
          <button
            type="button"
            onClick={openAddSalary}
            className="flex items-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            <span>{existingSalary ? 'Update Salary' : 'Receive Salary'}</span>
          </button>
        </div>
      </div>

      {/* Hero Monthly Salary Card */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-emerald-950/15 border border-emerald-700/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Monthly Salary Status • {formatMonthLabel(currentMonth)}
              </span>
              {existingSalary ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-200 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Received
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-200 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Pending Log
                </span>
              )}
            </div>

            <div className="text-3xl sm:text-4xl font-black text-white">
              {existingSalary
                ? formatCurrency(existingSalary.amount, currencySymbol)
                : formatCurrency(0, currencySymbol)}
            </div>

            <p className="text-xs text-emerald-200/80 mt-1">
              {existingSalary
                ? `Received on ${formatDisplayDate(existingSalary.transaction_date)} via ${existingSalary.payment_method.replace('_', ' ').toUpperCase()}`
                : user?.monthlySalary
                ? `No salary recorded for this month (Base reference: ${formatCurrency(user.monthlySalary, currencySymbol)}). Click below to record actual salary received.`
                : 'No salary recorded for this month. Click below to record actual salary received.'}
            </p>
          </div>

          <button
            type="button"
            onClick={openAddSalary}
            className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {existingSalary ? 'Update Salary' : 'Log Monthly Salary'}
          </button>
        </div>
      </div>

      {/* Income Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Month Income</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {formatCurrency(totalMonthIncome, currencySymbol)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            {allIncome.length} income entries recorded
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Base Salary</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {formatCurrency(existingSalary ? existingSalary.amount : 0, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
            {existingSalary ? 'Primary monthly compensation' : 'Not yet logged for this month'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bonuses & Other</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {formatCurrency(
              bonusAndOtherRecords.reduce((acc, c) => acc + c.amount, 0),
              currencySymbol
            )}
          </div>
          <span className="text-[11px] text-teal-600 font-semibold mt-0.5 block">
            {bonusAndOtherRecords.length} bonuses & commissions
          </span>
        </div>
      </div>

      {/* Bonus & Additional Earnings List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Bonuses, Freelance & Other Earnings</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Separate from your base salary</p>
          </div>
          <button
            type="button"
            onClick={openAddIncome}
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bonus</span>
          </button>
        </div>

        {bonusAndOtherRecords.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {bonusAndOtherRecords.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shadow-xs">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">{item.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="capitalize font-medium text-slate-600">{item.income_type}</span>
                      <span>•</span>
                      <span>{formatDisplayDate(item.transaction_date)}</span>
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span>{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-black text-emerald-600">
                    +{formatCurrency(item.amount, currencySymbol)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-600 rounded-lg transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs font-semibold text-slate-500">No extra bonuses recorded for this month.</p>
            <button
              type="button"
              onClick={openAddIncome}
              className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              + Add a bonus, freelance or gift entry
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteIncome}
        title="Delete Income Record"
        message="Are you sure you want to permanently delete this income entry? This will update your total earnings and available balance."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
