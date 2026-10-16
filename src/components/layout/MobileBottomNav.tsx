import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  BarChart3,
  PiggyBank,
  Settings,
} from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { openAddExpense } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'transactions', label: 'History', icon: Receipt },
    { id: 'add', label: 'Add', icon: Plus, isAction: true },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-1.5 pb-safe sm:hidden shadow-lg shadow-slate-900/5">
      <div className="flex items-center justify-around relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isAction) {
            return (
              <div key={item.id} className="relative -top-4 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => openAddExpense()}
                  className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 transition-all transform active:scale-95 active:shadow-sm"
                  aria-label="Add Expense"
                >
                  <Plus className="w-7 h-7 stroke-[2.5]" />
                </button>
                <span className="text-[10px] font-bold text-emerald-700 mt-1">Expense</span>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-600 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[11px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
