import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance } from '../../contexts/FinanceContext';
import { api } from '../../api/client';
import { formatMonthLabel } from '../../utils/dates';
import { formatCurrency } from '../../utils/currency';
import confetti from 'canvas-confetti';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const AddSalaryModal: React.FC = () => {
  const { user } = useAuth();
  const { isAddSalaryOpen, closeAddSalary, currentMonth, refreshDashboard } = useFinance();

  const [month, setMonth] = useState(currentMonth);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Monthly Salary');
  const [dateReceived, setDateReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate salary check alert state
  const [existingSalaryInfo, setExistingSalaryInfo] = useState<{
    id: string;
    amount: number;
  } | null>(null);

  const currencySymbol = user?.currencySymbol || '₹';

  useEffect(() => {
    if (isAddSalaryOpen) {
      setMonth(currentMonth);
      setAmount(user?.monthlySalary ? String(user.monthlySalary) : '');
      setDescription('Monthly Salary');
      setDateReceived(`${currentMonth}-01`);
      setPaymentMethod('bank_transfer');
      setNotes('');
      setError(null);
      setExistingSalaryInfo(null);
    }
  }, [isAddSalaryOpen, currentMonth, user]);

  const handleSubmit = async (e: React.FormEvent, forceDuplicate = false) => {
    if (e) e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid salary amount greater than zero');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/income/salary', {
        month,
        amount: numAmount,
        description: description.trim() || 'Monthly Salary',
        dateReceived,
        paymentMethod,
        notes: notes.trim() || undefined,
        forceDuplicate,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      await refreshDashboard();
      closeAddSalary();
    } catch (err: any) {
      if (err.status === 409 && err.data?.canUpdate) {
        setExistingSalaryInfo({
          id: err.data.existingSalaryId,
          amount: err.data.existingAmount,
        });
      } else {
        setError(err.message || 'Failed to add monthly salary');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExisting = async () => {
    if (!existingSalaryInfo) return;
    const numAmount = parseFloat(amount);
    setLoading(true);
    setError(null);

    try {
      await api.put(`/transactions/${existingSalaryInfo.id}`, {
        amount: numAmount,
        description: description.trim() || 'Monthly Salary',
        transactionDate: dateReceived,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      await refreshDashboard();
      closeAddSalary();
    } catch (err: any) {
      setError(err.message || 'Failed to update existing salary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAddSalaryOpen}
      onClose={closeAddSalary}
      title="Add Monthly Salary"
      subtitle={`Receive salary for ${formatMonthLabel(month)}`}
    >
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Existing Salary Conflict Notice */}
        {existingSalaryInfo && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Salary already recorded for {formatMonthLabel(month)}</p>
                <p className="text-amber-700 mt-0.5">
                  You already have a salary of <strong>{formatCurrency(existingSalaryInfo.amount, currencySymbol)}</strong> logged for this month.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleUpdateExisting}
                className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors text-center"
              >
                Update to {formatCurrency(parseFloat(amount) || 0, currencySymbol)}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="flex-1 py-2 px-3 bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 text-xs font-bold rounded-xl transition-colors text-center"
              >
                Add as Additional
              </button>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Salary Amount ({currencySymbol}) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="25000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-2xl font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Month Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Applying to Month *</label>
          <input
            type="month"
            required
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setDateReceived(`${e.target.value}-01`);
              setExistingSalaryInfo(null);
            }}
            className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Date Received */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Date Received *</label>
          <input
            type="date"
            required
            value={dateReceived}
            onChange={(e) => setDateReceived(e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
          <input
            type="text"
            placeholder="e.g., Included quarterly increment"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={closeAddSalary}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? 'Recording...' : 'Confirm Salary'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
