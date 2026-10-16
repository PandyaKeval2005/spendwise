import React from 'react';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dates';
import { getCategoryIcon } from '../../utils/categories';
import { useFinance } from '../../contexts/FinanceContext';
import { Receipt, ArrowRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface RecentTransactionsListProps {
  transactions: Transaction[];
  currencySymbol: string;
  onViewAll: () => void;
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  transactions,
  currencySymbol,
  onViewAll,
}) => {
  const { openTransactionDetail, openAddExpense } = useFinance();

  const hasTransactions = transactions && transactions.length > 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Recent Activity</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Latest transactions this month</p>
        </div>
        {hasTransactions && (
          <button
            type="button"
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {hasTransactions ? (
        <div className="divide-y divide-slate-100">
          {transactions.map((t) => {
            const isIncome = t.type === 'income';
            const Icon = getCategoryIcon(t.category_name);

            return (
              <div
                key={t.id}
                onClick={() => openTransactionDetail(t)}
                className="py-3 px-2 -mx-2 flex items-center justify-between hover:bg-slate-50/80 rounded-2xl cursor-pointer transition-colors group"
              >
                {/* Left: Category Icon & Details */}
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
                      <span className="font-medium text-slate-500">{t.category_name}</span>
                      <span>•</span>
                      <span>{formatDisplayDate(t.transaction_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Badge */}
                <div className="text-right shrink-0 ml-3">
                  <div
                    className={`text-xs sm:text-sm font-extrabold flex items-center justify-end gap-0.5 ${
                      isIncome ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(t.amount, currencySymbol)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mt-0.5">
                    {t.payment_method.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs font-semibold text-slate-500">No transactions recorded yet this month.</p>
          <button
            type="button"
            onClick={() => openAddExpense()}
            className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            + Add your first expense
          </button>
        </div>
      )}
    </div>
  );
};
