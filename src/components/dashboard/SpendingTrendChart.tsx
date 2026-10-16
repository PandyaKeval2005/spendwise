import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/currency';
import { Calendar, TrendingUp } from 'lucide-react';

interface DailyTrendItem {
  day: number;
  date: string;
  expense: number;
  income: number;
}

interface SpendingTrendChartProps {
  data: DailyTrendItem[];
  currencySymbol: string;
  onSelectDay?: (date: string) => void;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  data,
  currencySymbol,
  onSelectDay,
}) => {
  const [activeDay, setActiveDay] = useState<string | null>(null);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as DailyTrendItem;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs border border-slate-800">
          <p className="font-bold text-slate-300 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{item.date} (Day {label})</span>
          </p>
          <div className="space-y-1">
            <p className="text-red-300">
              Spent: <strong>{formatCurrency(item.expense, currencySymbol)}</strong>
            </p>
            {item.income > 0 && (
              <p className="text-emerald-300">
                Income: <strong>{formatCurrency(item.income, currencySymbol)}</strong>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const hasSpending = data.some((d) => d.expense > 0);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Daily Spending Trend</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            All calendar days included • Click any bar to view details
          </p>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        {hasSpending ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onClick={(state) => {
                if (state && state.activePayload && state.activePayload.length) {
                  const clicked = state.activePayload[0].payload as DailyTrendItem;
                  setActiveDay(clicked.date);
                  if (onSelectDay) onSelectDay(clicked.date);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="expense"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      activeDay === entry.date
                        ? '#059669'
                        : entry.expense > 0
                        ? '#f87171' // coral/red for expense
                        : '#e2e8f0'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <p className="text-xs font-semibold text-slate-400">No expenses recorded for this month yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Tap + Expense to log your first transaction.</p>
          </div>
        )}
      </div>
    </div>
  );
};
