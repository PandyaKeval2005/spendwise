import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  User,
  Bell,
  Download,
  Shield,
  Key,
  Trash2,
  CheckCircle2,
  Moon,
  Sun,
  FileSpreadsheet,
  Wallet,
  Save,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout, updateProfile } = useAuth();
  const { openExportModal, currentMonth, refreshDashboard } = useFinance();

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [openingBalance, setOpeningBalance] = useState<number | string>(user?.openingBalance ?? 0);
  const [monthlySalary, setMonthlySalary] = useState<number | string>(user?.monthlySalary ?? 0);
  const [monthlyBudget, setMonthlyBudget] = useState<number | string>(user?.monthlyBudget ?? 0);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync profile form state when user changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setOpeningBalance(user.openingBalance ?? 0);
      setMonthlySalary(user.monthlySalary ?? 0);
      setMonthlyBudget(user.monthlyBudget ?? 0);
    }
  }, [user]);

  // Preferences state
  const [salaryReminder, setSalaryReminder] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [budgetThreshold, setBudgetThreshold] = useState(80);
  const [monthlyReviewReminder, setMonthlyReviewReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:00');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const p = await api.get<any>('/preferences');
        if (p) {
          setSalaryReminder(Boolean(p.salary_reminder_enabled));
          setDailyReminder(Boolean(p.daily_expense_reminder));
          setBudgetThreshold(p.budget_alert_threshold || 80);
          setMonthlyReviewReminder(Boolean(p.monthly_review_reminder));
          setReminderTime(p.reminder_time || '20:00');
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      }
    };
    fetchPrefs();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);

    try {
      await updateProfile({
        displayName: displayName.trim(),
        openingBalance: Number(openingBalance) || 0,
        monthlySalary: Number(monthlySalary) || 0,
        monthlyBudget: Number(monthlyBudget) || 0,
      });
      await refreshDashboard();
      setProfileMsg({ type: 'success', text: 'Profile & financial settings updated successfully!' });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateReminder = async (field: string, value: any) => {
    try {
      await api.put('/preferences', { [field]: value });
    } catch (err) {
      console.error('Failed to update preference:', err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      setDeleteError('Please enter your password to confirm account deletion');
      return;
    }

    try {
      await api.post('/auth/delete-account', { password: deleteConfirmPassword });
      window.location.reload();
    } catch (err: any) {
      setDeleteError(err.message || 'Incorrect password');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Settings & Privacy
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure reminders, security credentials, and data exports
        </p>
      </div>

      {/* Profile & Financial Settings Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Profile & Financial Baseline</span>
          </h3>
          <span className="text-[11px] text-slate-400">Manage real baseline balances and settings</span>
        </div>

        {profileMsg && (
          <div
            className={`p-3 text-xs rounded-xl border flex items-center gap-2 ${
              profileMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {profileMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-xs bg-slate-100/70 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Opening Balance ({user?.currencySymbol || '₹'})
              </label>
              <input
                type="number"
                step="any"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                placeholder="0"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Initial balance carried forward. Keep at 0 to track from zero baseline without artificial funds.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standard Monthly Salary ({user?.currencySymbol || '₹'})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                placeholder="0"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Baseline salary amount for quick logging when monthly salary is credited.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Monthly Budget ({user?.currencySymbol || '₹'})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                placeholder="0"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Target monthly spending limit. Set to 0 if no budget warning is needed.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
              <div className="w-full px-3 py-2 text-xs bg-slate-100/70 border border-slate-200 rounded-xl text-slate-700 font-semibold">
                {user?.currency || 'INR'} ({user?.currencySymbol || '₹'})
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Reminders & Alerts Configuration */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600" />
          <span>User-Controlled Reminders & Alerts</span>
        </h3>

        <div className="space-y-3 divide-y divide-slate-100">
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Salary Credit Reminder</span>
              <span className="text-[11px] text-slate-400 block">Prompt to log salary at the start of each month</span>
            </div>
            <input
              type="checkbox"
              checked={salaryReminder}
              onChange={(e) => {
                setSalaryReminder(e.target.checked);
                handleUpdateReminder('salary_reminder_enabled', e.target.checked ? 1 : 0);
              }}
              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Daily Expense Logging Reminder</span>
              <span className="text-[11px] text-slate-400 block">Evening reminder to record today's purchases</span>
            </div>
            <input
              type="checkbox"
              checked={dailyReminder}
              onChange={(e) => {
                setDailyReminder(e.target.checked);
                handleUpdateReminder('daily_expense_reminder', e.target.checked ? 1 : 0);
              }}
              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Budget Alert Threshold</span>
              <span className="text-[11px] text-slate-400 block">Trigger alert when spending reaches threshold</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={budgetThreshold}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBudgetThreshold(val);
                  handleUpdateReminder('budget_alert_threshold', val);
                }}
                className="py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value={70}>70%</option>
                <option value={80}>80% (Recommended)</option>
                <option value={90}>90%</option>
                <option value={100}>100%</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Monthly Financial Review</span>
              <span className="text-[11px] text-slate-400 block">Prompt at month-end to download Excel summary</span>
            </div>
            <input
              type="checkbox"
              checked={monthlyReviewReminder}
              onChange={(e) => {
                setMonthlyReviewReminder(e.target.checked);
                handleUpdateReminder('monthly_review_reminder', e.target.checked ? 1 : 0);
              }}
              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Data Export & Backup */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Excel Data Export & Backup</span>
        </h3>
        <p className="text-xs text-slate-500">
          Export your complete financial records into professional multi-sheet Excel (.xlsx) workbooks for your personal archives.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={openExportModal}
            className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 rounded-2xl text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Monthly Excel Report</span>
              <span className="text-[10px] text-slate-400 block">6-sheet comprehensive workbook</span>
            </div>
          </button>

          <button
            type="button"
            onClick={openExportModal}
            className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 rounded-2xl text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">All Transactions Export</span>
              <span className="text-[10px] text-slate-400 block">Complete historical spreadsheet</span>
            </div>
          </button>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-600" />
          <span>Change Password</span>
        </h3>

        {passwordMsg && (
          <div
            className={`p-3 text-xs rounded-xl border ${
              passwordMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-red-50/50 border border-red-200 rounded-3xl p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-red-950 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-600" />
          <span>Danger Zone • Delete Account</span>
        </h3>
        <p className="text-xs text-red-800 leading-relaxed">
          Permanently delete your account and all associated transactions, categories, and monthly records. This action cannot be undone.
        </p>

        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          Delete Account & All Data
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h4 className="text-base font-bold text-slate-900">Confirm Permanent Deletion</h4>
            <p className="text-xs text-slate-500">
              Please enter your password to confirm that you want to permanently delete your SpendWise account and all financial records.
            </p>

            {deleteError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {deleteError}
              </div>
            )}

            <input
              type="password"
              placeholder="Your current password"
              value={deleteConfirmPassword}
              onChange={(e) => setDeleteConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteError(null);
                  setDeleteConfirmPassword('');
                }}
                className="flex-1 py-2 px-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
