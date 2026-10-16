import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { formatCurrency } from '../../utils/currency';
import { getCategoryIcon } from '../../utils/categories';
import { PieChart as PieIcon } from 'lucide-react';

interface CategoryItem {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  total: number;
  percentage: number;
}

interface CategoryBreakdownChartProps {
  categories: CategoryItem[];
  currencySymbol: string;
  totalExpenses: number;
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  categories,
  currencySymbol,
  totalExpenses,
}) => {
  const hasData = categories && categories.length > 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryItem;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs border border-slate-800">
          <p className="font-bold text-slate-200 mb-1">{data.categoryName}</p>
          <p className="text-emerald-400 font-extrabold text-sm">
            {formatCurrency(data.total, currencySymbol)}
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">{data.percentage}% of monthly spending</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
          <PieIcon className="w-4 h-4 text-emerald-600" />
          <span>Category Breakdown</span>
        </h3>
        <p className="text-xs text-slate-400">Spending distribution this month</p>
      </div>

      {hasData ? (
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
          {/* Doughnut Chart */}
          <div className="w-48 h-48 relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={categories}
                  dataKey="total"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="none"
                >
                  {categories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || '#10b981'}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Total Summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                {formatCurrency(totalExpenses, currencySymbol, false)}
              </span>
            </div>
          </div>

          {/* Category List Legend */}
          <div className="flex-1 w-full space-y-2 max-h-52 overflow-y-auto pr-1">
            {categories.slice(0, 6).map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color || '#059669' }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-slate-700 truncate">{cat.categoryName}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-bold text-slate-900 block">
                      {formatCurrency(cat.total, currencySymbol)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{cat.percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-xs font-semibold text-slate-400">No expenses recorded for this month.</p>
        </div>
      )}
    </div>
  );
};
