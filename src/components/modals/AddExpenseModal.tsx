import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance } from '../../contexts/FinanceContext';
import { api } from '../../api/client';
import { getCategoryIcon } from '../../utils/categories';
import { PaymentMethod } from '../../types';
import confetti from 'canvas-confetti';

export const AddExpenseModal: React.FC = () => {
  const { user } = useAuth();
  const { isAddExpenseOpen, closeAddExpense, refreshDashboard, categories, expensePrefill } = useFinance();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [transactionDate, setTransactionDate] = useState('');
  const [transactionTime, setTransactionTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const currencySymbol = user?.currencySymbol || '₹';

  // Reset or prefill on open
  useEffect(() => {
    if (isAddExpenseOpen) {
      setError(null);
      const now = new Date();
      setAmount(expensePrefill?.amount ? String(expensePrefill.amount) : '');
      setDescription(expensePrefill?.description || '');
      setCategoryId(expensePrefill?.category_id || (expenseCategories[0]?.id || ''));
      setPaymentMethod(expensePrefill?.payment_method || 'upi');
      setTransactionDate(expensePrefill?.transaction_date || now.toISOString().split('T')[0]);
      setTransactionTime(expensePrefill?.transaction_time || now.toTimeString().substring(0, 5));
      setNotes(expensePrefill?.notes || '');
      setIsRecurring(Boolean(expensePrefill?.is_recurring));
    }
  }, [isAddExpenseOpen, expensePrefill, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount greater than zero');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description or merchant name');
      return;
    }
    if (!categoryId) {
      setError('Please select an expense category');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/transactions', {
        type: 'expense',
        amount: numAmount,
        description: description.trim(),
        categoryId,
        paymentMethod,
        transactionDate,
        transactionTime,
        notes: notes.trim() || undefined,
        isRecurring,
        status: 'confirmed',
      });

      // Quick soft confetti feedback for milestone logging
      try {
        confetti({
          particleCount: 20,
          spread: 45,
          origin: { y: 0.9 },
          colors: ['#059669', '#10B981', '#34D399'],
        });
      } catch {}

      await refreshDashboard();
      closeAddExpense();
    } catch (err: any) {
      setError(err.message || 'Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  const quickDescriptions = ['Groceries', 'Coffee / Snacks', 'Uber / Auto', 'Lunch / Dinner', 'Electricity Bill', 'Pharmacy'];

  return (
    <Modal
      isOpen={isAddExpenseOpen}
      onClose={closeAddExpense}
      title="Record New Expense"
      subtitle="Track your daily spending accurately"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Amount Input (Hero) */}
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
              className="w-full pl-10 pr-4 py-3 text-2xl font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Description & Quick Chips */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Description / Merchant *
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Grocery shopping at D-Mart"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {quickDescriptions.map((desc) => (
              <button
                key={desc}
                type="button"
                onClick={() => setDescription(desc)}
                className="text-[11px] font-medium py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              >
                {desc}
              </button>
            ))}
          </div>
        </div>

        {/* Category Selector Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Category *
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
            {expenseCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              const isSelected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white mb-1 shadow-xs"
                    style={{ backgroundColor: cat.color || '#059669' }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold truncate w-full">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
            <input
              type="time"
              value={transactionTime}
              onChange={(e) => setTransactionTime(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'upi', label: 'UPI / GPay' },
              { id: 'debit_card', label: 'Debit Card' },
              { id: 'credit_card', label: 'Credit Card' },
              { id: 'cash', label: 'Cash' },
              { id: 'bank_transfer', label: 'NetBanking' },
              { id: 'other', label: 'Other' },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                  paymentMethod === method.id
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
          <input
            type="text"
            placeholder="Add any extra details or receipt reference"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={closeAddExpense}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
