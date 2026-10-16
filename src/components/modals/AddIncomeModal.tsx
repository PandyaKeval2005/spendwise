import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance } from '../../contexts/FinanceContext';
import { api } from '../../api/client';
import { IncomeType } from '../../types';
import confetti from 'canvas-confetti';

export const AddIncomeModal: React.FC = () => {
  const { user } = useAuth();
  const { isAddIncomeOpen, closeAddIncome, currentMonth, refreshDashboard } = useFinance();

  const [amount, setAmount] = useState('');
  const [incomeType, setIncomeType] = useState<IncomeType>('bonus');
  const [description, setDescription] = useState('');
  const [dateReceived, setDateReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = user?.currencySymbol || '₹';

  useEffect(() => {
    if (isAddIncomeOpen) {
      setAmount('');
      setIncomeType('bonus');
      setDescription('Performance Bonus');
      setDateReceived(new Date().toISOString().split('T')[0]);
      setPaymentMethod('bank_transfer');
      setNotes('');
      setError(null);
    }
  }, [isAddIncomeOpen]);

  const incomeTypeOptions: Array<{ id: IncomeType; label: string; defaultDesc: string }> = [
    { id: 'bonus', label: 'Bonus', defaultDesc: 'Performance Bonus' },
    { id: 'incentive', label: 'Incentive', defaultDesc: 'Sales Commission' },
    { id: 'freelance', label: 'Freelance', defaultDesc: 'Freelance Project Payout' },
    { id: 'gift', label: 'Gift', defaultDesc: 'Gift from Family' },
    { id: 'reimbursement', label: 'Reimbursement', defaultDesc: 'Office Travel Expense Claim' },
    { id: 'other', label: 'Other', defaultDesc: 'Other Income' },
  ];

  const handleTypeSelect = (type: IncomeType) => {
    setIncomeType(type);
    const opt = incomeTypeOptions.find((o) => o.id === type);
    if (opt && (!description || incomeTypeOptions.some((o) => o.defaultDesc === description))) {
      setDescription(opt.defaultDesc);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid income amount greater than zero');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/income/bonus', {
        month: currentMonth,
        amount: numAmount,
        incomeType,
        description: description.trim(),
        dateReceived,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}

      await refreshDashboard();
      closeAddIncome();
    } catch (err: any) {
      setError(err.message || 'Failed to record income');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAddIncomeOpen}
      onClose={closeAddIncome}
      title="Add Bonus / Other Income"
      subtitle="Record incentives, freelance, or gifts"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Amount ({currencySymbol}) *
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
              autoFocus
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-2xl font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Income Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Income Type *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {incomeTypeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleTypeSelect(opt.id)}
                className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition-all text-center ${
                  incomeType === opt.id
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Date Received */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date Received *</label>
            <input
              type="date"
              required
              value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="bank_transfer">Bank Transfer / NEFT</option>
              <option value="upi">UPI / GPay / PhonePe</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
          <input
            type="text"
            placeholder="Additional details"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={closeAddIncome}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? 'Saving...' : 'Add Income'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
