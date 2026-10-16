import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { api } from '../api/client';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDisplayDate, formatDisplayTime } from '../utils/dates';
import { getCategoryIcon } from '../utils/categories';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  X,
  SlidersHorizontal,
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const { currentMonth, openAddExpense, openTransactionDetail, categories, openExportModal } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const currencySymbol = user?.currencySymbol || '₹';

  // Fetch transactions based on filters
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('month', currentMonth);
      if (activeTab !== 'all') params.set('type', activeTab);
      if (search.trim()) params.set('search', search.trim());
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (selectedPayment) params.set('paymentMethod', selectedPayment);
      params.set('sortBy', sortBy);

      const res = await api.get<{
        transactions: Transaction[];
        totalCount: number;
        totalAmount: number;
      }>(`/transactions?${params.toString()}`);

      setTransactions(res.transactions);
      setTotalCount(res.totalCount);
      setTotalAmount(res.totalAmount);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentMonth, activeTab, search, selectedCategory, selectedPayment, sortBy]);

  // Group transactions by date with daily subtotals
  const groupedByDate = useMemo(() => {
    const groups: Record<
      string,
      {
        date: string;
        transactions: Transaction[];
        dailyIncome: number;
        dailyExpense: number;
        dailyNet: number;
      }
    > = {};

    for (const t of transactions) {
      if (!groups[t.transaction_date]) {
        groups[t.transaction_date] = {
          date: t.transaction_date,
          transactions: [],
          dailyIncome: 0,
          dailyExpense: 0,
          dailyNet: 0,
        };
      }
      groups[t.transaction_date].transactions.push(t);
      if (t.type === 'income') {
        groups[t.transaction_date].dailyIncome += t.amount;
      } else {
        groups[t.transaction_date].dailyExpense += t.amount;
      }
      groups[t.transaction_date].dailyNet =
        groups[t.transaction_date].dailyIncome - groups[t.transaction_date].dailyExpense;
    }

    return Object.values(groups);
  }, [transactions]);

  const hasActiveFilters = Boolean(selectedCategory || selectedPayment || search);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedPayment('');
    setSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Transaction History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed ledger with daily groupings and subtotals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openExportModal}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export XLSX</span>
          </button>
          <button
            type="button"
            onClick={() => openAddExpense()}
            className="flex items-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Tabs: All / Expenses / Income */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'expense', label: 'Expenses Only' },
              { id: 'income', label: 'Income Only' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 sm:flex-initial py-1.5 px-4 text-xs font-bold rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1 px-3 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Search Input & Filter Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by merchant, description, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl border transition-colors ${
              hasActiveFilters
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilterDrawer && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-up">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Payment Method</label>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">All Payment Methods</option>
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="debit_card">Debit Card</option>
                <option value="credit_card">Credit Card</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">NetBanking / Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            {hasActiveFilters && (
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filter Summary Header */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
          <span>Found <strong>{totalCount}</strong> transactions</span>
          {activeTab !== 'all' && (
            <span>
              Total {activeTab === 'expense' ? 'Expenses' : 'Income'}:{' '}
              <strong className="text-slate-900">{formatCurrency(totalAmount, currencySymbol)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Grouped Daily Transactions List */}
      {groupedByDate.length > 0 ? (
        <div className="space-y-6">
          {groupedByDate.map((group) => (
            <div key={group.date} className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
              {/* Daily Header with Subtotals */}
              <div className="bg-slate-50/90 px-5 py-3 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {formatDisplayDate(group.date)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  {group.dailyIncome > 0 && (
                    <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      +{formatCurrency(group.dailyIncome, currencySymbol)}
                    </span>
                  )}
                  {group.dailyExpense > 0 && (
                    <span className="text-red-700 bg-red-100/70 px-2 py-0.5 rounded-full">
                      -{formatCurrency(group.dailyExpense, currencySymbol)}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions in Date */}
              <div className="divide-y divide-slate-100">
                {group.transactions.map((t) => {
                  const isIncome = t.type === 'income';
                  const Icon = getCategoryIcon(t.category_name);

                  return (
                    <div
                      key={t.id}
                      onClick={() => openTransactionDetail(t)}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/70 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                            {t.description}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-semibold text-slate-600">{t.category_name}</span>
                            <span>•</span>
                            <span>{formatDisplayTime(t.transaction_time)}</span>
                            {t.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[120px] text-slate-400">{t.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <div
                          className={`text-xs sm:text-sm font-extrabold ${
                            isIncome ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatCurrency(t.amount, currencySymbol)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                          {t.payment_method.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white border border-slate-200/80 rounded-3xl p-6">
          <p className="text-sm font-bold text-slate-800">No transactions match the selected criteria.</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or record a new transaction for this month.
          </p>
          <button
            type="button"
            onClick={() => openAddExpense()}
            className="mt-4 py-2 px-4 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-700 transition-colors"
          >
            + Add Expense
          </button>
        </div>
      )}
    </div>
  );
};
