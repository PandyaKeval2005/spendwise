import React from 'react';
import { Plus, Briefcase, Award, Receipt, Download } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';

interface QuickActionsProps {
  onSelectTab: (tab: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectTab }) => {
  const { openAddExpense, openAddSalary, openAddIncome, openExportModal } = useFinance();

  const actions = [
    {
      id: 'expense',
      label: 'Add Expense',
      description: 'Record spending',
      icon: Plus,
      onClick: () => openAddExpense(),
      primary: true,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
    },
    {
      id: 'salary',
      label: 'Add Salary',
      description: 'Monthly paycheck',
      icon: Briefcase,
      onClick: openAddSalary,
      color: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80',
    },
    {
      id: 'bonus',
      label: 'Add Bonus',
      description: 'Gifts & side income',
      icon: Award,
      onClick: openAddIncome,
      color: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80',
    },
    {
      id: 'transactions',
      label: 'All History',
      description: 'View & search records',
      icon: Receipt,
      onClick: () => onSelectTab('transactions'),
      color: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80',
    },
    {
      id: 'download',
      label: 'Excel Report',
      description: 'Download .xlsx',
      icon: Download,
      onClick: openExportModal,
      color: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            type="button"
            onClick={act.onClick}
            className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-xs ${act.color}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
              act.primary ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              <Icon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold leading-tight">{act.label}</span>
            <span className={`text-[10px] mt-0.5 ${act.primary ? 'text-white/80' : 'text-slate-400'}`}>
              {act.description}
            </span>
          </button>
        );
      })}
    </div>
  );
};
