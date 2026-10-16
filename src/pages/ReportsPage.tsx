import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { api } from '../api/client';
import { formatCurrency } from '../utils/currency';
import { formatDisplayDate } from '../utils/dates';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingDown,
  TrendingUp,
  Award,
  Zap,
  RefreshCw,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { openExportModal } = useFinance();

  const [period, setPeriod] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const currencySymbol = user?.currencySymbol || '₹';

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'prev_month', label: 'Previous Month' },
    { id: 'last_3_months', label: 'Last 3 Months' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/reports/analytics?period=${period}`;
      if (period === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const data = await api.get<any>(url);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (customStart && customEnd)) {
      fetchAnalytics();
    }
  }, [period, customStart, customEnd]);

  const summary = analyticsData?.summary;
  const dailyStats = analyticsData?.dailyStats;
  const mostExpensive = analyticsData?.mostExpensiveTransaction;
  const categoryBreakdown = analyticsData?.categoryBreakdown || [];
  const monthlyComparisons = analyticsData?.monthlyComparisons || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Financial Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Spending habits, comparisons, and period statistics
          </p>
        </div>
        <button
          type="button"
          onClick={openExportModal}
          className="flex items-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Excel Workbook</span>
        </button>
      </div>

      {/* Date Range Selector Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all ${
                period === p.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        )}
      </div>

      {loading && !analyticsData ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <span className="text-xs font-semibold">Calculating analytics...</span>
        </div>
      ) : summary ? (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Income
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600">
                {formatCurrency(summary.totalIncome, currencySymbol)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">During this period</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Expenses
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {formatCurrency(summary.totalExpenses, currencySymbol)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {summary.spendingPercentage}% of income
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Net Savings
              </span>
              <div className={`text-xl sm:text-2xl font-black ${
                summary.netAmount >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}>
                {formatCurrency(summary.netAmount, currencySymbol)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Savings rate: {summary.savingsRate}%
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Daily Average Spend
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {formatCurrency(dailyStats?.averageDailySpending || 0, currencySymbol)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Over {analyticsData.totalDays} days
              </span>
            </div>
          </div>

          {/* Highlights & Daily Extremes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Highest Spending Day */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Highest Spending Day
                </span>
                <span className="text-base font-extrabold text-slate-900 block truncate">
                  {formatCurrency(dailyStats?.highestSpendingDay?.amount || 0, currencySymbol)}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {dailyStats?.highestSpendingDay?.date
                    ? formatDisplayDate(dailyStats.highestSpendingDay.date)
                    : 'None'}
                </span>
              </div>
            </div>

            {/* Lowest Active Spending Day */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Lowest Active Day
                </span>
                <span className="text-base font-extrabold text-slate-900 block truncate">
                  {formatCurrency(dailyStats?.lowestSpendingDay?.amount || 0, currencySymbol)}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {dailyStats?.lowestSpendingDay?.date
                    ? formatDisplayDate(dailyStats.lowestSpendingDay.date)
                    : 'None'}
                </span>
              </div>
            </div>

            {/* Most Expensive Transaction */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Top Transaction
                </span>
                <span className="text-base font-extrabold text-slate-900 block truncate">
                  {mostExpensive ? formatCurrency(mostExpensive.amount, currencySymbol) : '₹0.00'}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {mostExpensive ? mostExpensive.description : 'No transactions recorded'}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Comparison Bar Chart */}
          {monthlyComparisons.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
              <div className="mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Income vs. Expenses Comparison</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Historical month-by-month financial trend</p>
              </div>

              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparisons} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value, currencySymbol)}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category Breakdown Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
              Category-Wise Spending Breakdown
            </h3>
            <p className="text-xs text-slate-400 mb-4">Detailed ranking of where your money went</p>

            {categoryBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Total Spent</th>
                      <th className="py-2.5 px-3 text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categoryBreakdown.map((c: any) => (
                      <tr key={c.categoryName} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || '#059669' }} />
                          <span>{c.categoryName}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(c.total, currencySymbol)}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-500">
                          {c.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No expense records found for this period.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
