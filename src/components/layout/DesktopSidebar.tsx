import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  PiggyBank,
  Briefcase,
  Settings,
  Plus,
  LogOut,
  Download,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance } from '../../contexts/FinanceContext';
import { formatCurrency } from '../../utils/currency';

interface DesktopSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { user, logout } = useAuth();
  const { openAddExpense, openAddSalary, openAddIncome, openExportModal, dashboardData } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'income', label: 'Salary & Income', icon: Briefcase },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'budgets', label: 'Monthly Budgets', icon: PiggyBank },
    { id: 'settings', label: 'Settings & Privacy', icon: Settings },
  ];

  const currencySymbol = user?.currencySymbol || '₹';
  const availableBal = dashboardData?.summary?.availableBalance ?? user?.openingBalance ?? 0;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-screen sticky top-0 px-4 py-6 z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">SpendWise</h1>
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mt-1">Personal Finance</p>
        </div>
      </div>

      {/* Available Balance Pill */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-4 mb-6">
        <span className="text-xs font-medium text-emerald-800">Available Balance</span>
        <div className="text-xl font-extrabold text-emerald-950 mt-1">
          {formatCurrency(availableBal, currencySymbol)}
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="space-y-2 mb-6">
        <button
          type="button"
          onClick={() => openAddExpense()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs shadow-emerald-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Expense</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={openAddSalary}
            className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors text-center truncate"
          >
            + Salary
          </button>
          <button
            type="button"
            onClick={openAddIncome}
            className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors text-center truncate"
          >
            + Bonus
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer & User Profile */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <button
          onClick={openExportModal}
          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <Download className="w-4 h-4 text-slate-400" />
          <span>Download Reports</span>
        </button>

        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.displayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
