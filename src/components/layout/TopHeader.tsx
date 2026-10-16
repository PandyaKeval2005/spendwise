import React from 'react';
import { Download, Plus, Wallet, LogOut, User as UserIcon } from 'lucide-react';
import { MonthSelector } from '../common/MonthSelector';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance } from '../../contexts/FinanceContext';

interface TopHeaderProps {
  onSelectTab: (tab: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onSelectTab }) => {
  const { user, logout } = useAuth();
  const { currentMonth, setCurrentMonth, openAddExpense, openExportModal } = useFinance();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand on Mobile (hidden on Desktop where sidebar exists) */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-none">SpendWise</h1>
            <span className="text-[10px] font-semibold text-emerald-600">Finance</span>
          </div>
        </div>

        {/* Center: Month Selector */}
        <div className="flex-1 flex justify-center sm:justify-start">
          <MonthSelector
            currentMonth={currentMonth}
            onChange={setCurrentMonth}
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Download Report Button */}
          <button
            type="button"
            onClick={openExportModal}
            className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            title="Download Monthly Excel Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Excel Report</span>
          </button>

          {/* Quick Add Expense button for Desktop */}
          <button
            type="button"
            onClick={() => openAddExpense()}
            className="hidden md:flex lg:hidden items-center gap-1.5 py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Expense</span>
          </button>

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-1.5 pl-1 sm:pl-2">
            <button
              onClick={() => onSelectTab('settings')}
              className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs hover:border-emerald-500 transition-colors"
              title="Settings & Profile"
            >
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={logout}
              className="hidden sm:block p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
