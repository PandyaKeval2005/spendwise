import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance } from '../../contexts/FinanceContext';
import { api } from '../../api/client';
import { formatCurrency } from '../../utils/currency';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dates';
import { getCategoryIcon } from '../../utils/categories';
import { Trash2, Copy, Edit3, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const TransactionDetailModal: React.FC = () => {
  const { user } = useAuth();
  const { selectedTransaction, closeTransactionDetail, refreshDashboard, categories } = useFinance();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit fields
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [transactionTime, setTransactionTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const currencySymbol = user?.currencySymbol || '₹';

  useEffect(() => {
    if (selectedTransaction) {
      setAmount(String(selectedTransaction.amount));
      setDescription(selectedTransaction.description);
      setCategoryId(selectedTransaction.category_id);
      setTransactionDate(selectedTransaction.transaction_date);
      setTransactionTime(selectedTransaction.transaction_time || '12:00');
      setPaymentMethod(selectedTransaction.payment_method);
      setNotes(selectedTransaction.notes || '');
      setIsEditing(false);
      setError(null);
    }
  }, [selectedTransaction]);

  if (!selectedTransaction) return null;

  const isIncome = selectedTransaction.type === 'income';
  const Icon = getCategoryIcon(selectedTransaction.category_name);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.put(`/transactions/${selectedTransaction.id}`, {
        amount: numAmount,
        description: description.trim(),
        categoryId,
        transactionDate,
        transactionTime,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      await refreshDashboard();
      closeTransactionDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setLoading(true);
    try {
      await api.post(`/transactions/${selectedTransaction.id}/duplicate`);
      await refreshDashboard();
      closeTransactionDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/transactions/${selectedTransaction.id}`);
      await refreshDashboard();
      setIsDeleteOpen(false);
      closeTransactionDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={Boolean(selectedTransaction)}
        onClose={closeTransactionDetail}
        title={isEditing ? 'Edit Transaction' : 'Transaction Details'}
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl mb-3">
            {error}
          </div>
        )}

        {!isEditing ? (
          <div className="space-y-6">
            {/* Amount Banner */}
            <div className={`p-6 rounded-3xl text-center border ${
              isIncome
                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                : 'bg-red-50/70 border-red-200/80 text-red-950'
            }`}>
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                {isIncome ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isIncome ? (selectedTransaction.income_type || 'Income') : 'Expense'}
                </span>
              </div>
              <div className="text-3xl font-black tracking-tight">
                {isIncome ? '+' : '-'}{formatCurrency(selectedTransaction.amount, currencySymbol)}
              </div>
              <p className="text-sm font-semibold text-slate-700 mt-1">{selectedTransaction.description}</p>
            </div>

            {/* Key Information Table */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl divide-y divide-slate-100 text-xs">
              <div className="flex items-center justify-between p-3.5">
                <span className="text-slate-500 font-medium">Category</span>
                <span className="font-bold text-slate-900">{selectedTransaction.category_name}</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-slate-500 font-medium">Date & Time</span>
                <span className="font-bold text-slate-900">
                  {formatDisplayDate(selectedTransaction.transaction_date)} • {formatDisplayTime(selectedTransaction.transaction_time)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-slate-500 font-medium">Payment Method</span>
                <span className="font-bold text-slate-900 uppercase">{selectedTransaction.payment_method.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-slate-500 font-medium">Status</span>
                <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full capitalize">
                  {selectedTransaction.status}
                </span>
              </div>
              {selectedTransaction.notes && (
                <div className="p-3.5 space-y-1">
                  <span className="text-slate-500 font-medium block">Notes</span>
                  <p className="text-slate-800 font-medium">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="p-2.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Inline Edit Form */
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount ({currencySymbol}) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories
                  .filter((c) => c.type === selectedTransaction.type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                <input
                  type="time"
                  value={transactionTime}
                  onChange={(e) => setTransactionTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message={`Are you sure you want to permanently delete this ${selectedTransaction.type} of ${formatCurrency(selectedTransaction.amount, currencySymbol)}? This will recalculate all monthly totals.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={loading}
      />
    </>
  );
};
