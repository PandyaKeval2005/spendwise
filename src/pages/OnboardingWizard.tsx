import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Wallet,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calendar,
  PiggyBank,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const OnboardingWizard: React.FC = () => {
  const { user, completeOnboarding } = useAuth();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [monthlySalary, setMonthlySalary] = useState(user?.monthlySalary ? String(user.monthlySalary) : '');
  const [salaryDay, setSalaryDay] = useState(user?.salaryDay || 1);
  const [openingBalance, setOpeningBalance] = useState(user?.openingBalance ? String(user.openingBalance) : '0');
  const [monthlyBudget, setMonthlyBudget] = useState(user?.monthlyBudget ? String(user.monthlyBudget) : '0');
  const [autoRecurringSalary, setAutoRecurringSalary] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding({
        displayName: displayName.trim() || 'User',
        currency,
        currencySymbol,
        monthlySalary: parseFloat(monthlySalary) || 0,
        salaryDay: Number(salaryDay) || 1,
        openingBalance: parseFloat(openingBalance) || 0,
        monthlyBudget: parseFloat(monthlyBudget) || 0,
        autoRecurringSalary,
      });

      try {
        confetti({
          particleCount: 80,
          spread: 90,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Welcome to SpendWise</h2>
          <p className="text-xs sm:text-sm text-emerald-300 font-medium mt-1">
            Let's personalize your personal salary and expense manager
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-8 bg-emerald-400' : i < step ? 'w-4 bg-emerald-700' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Card */}
        <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100">
          {/* STEP 1: Name and Currency */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Step 1 of 4 • Profile & Currency</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">What should we call you?</h3>
              <p className="text-xs text-slate-500">Your preferred display name and default financial currency.</p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Priya"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Currency</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR ₹)' },
                    { code: 'USD', symbol: '$', label: 'US Dollar (USD $)' },
                    { code: 'EUR', symbol: '€', label: 'Euro (EUR €)' },
                    { code: 'GBP', symbol: '£', label: 'British Pound (GBP £)' },
                  ].map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencySymbol(c.symbol);
                      }}
                      className={`p-3 text-left text-xs font-bold rounded-xl border transition-all ${
                        currency === c.code
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm block">{c.symbol}</span>
                      <span className="text-[11px] font-medium text-slate-500">{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Monthly Salary */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <Briefcase className="w-4 h-4" />
                <span>Step 2 of 4 • Monthly Salary</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">What is your typical monthly salary?</h3>
              <p className="text-xs text-slate-500">
                You can easily adjust this whenever you receive raises or irregular payments.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Salary ({currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25000"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xl font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Salary Credit Date (Day of Month)
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={salaryDay}
                    onChange={(e) => setSalaryDay(Number(e.target.value))}
                    className="w-24 px-3 py-2 text-sm text-center font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <span className="text-xs text-slate-500">of every month (e.g., 1st or 30th)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Opening Balance & Savings */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <PiggyBank className="w-4 h-4" />
                <span>Step 3 of 4 • Opening Balance</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Opening Balance / Carried Savings</h3>
              <p className="text-xs text-slate-500">
                Do you have existing savings or money in hand to start tracking with? (Optional)
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Opening Balance ({currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xl font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  This is kept strictly separate from your monthly income.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Budget Target */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <CheckCircle className="w-4 h-4" />
                <span>Step 4 of 4 • Monthly Budget Target</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Set Monthly Spending Budget</h3>
              <p className="text-xs text-slate-500">
                Set a monthly spending limit to receive helpful progress updates and stay on track.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Budget Limit ({currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15000"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xl font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Monthly Salary Reminder</span>
                  <span className="text-[11px] text-slate-500 block">Prompt to log salary on day {salaryDay}</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoRecurringSalary}
                  onChange={(e) => setAutoRecurringSalary(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Skip for now
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex items-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Setting up...' : 'Go to Dashboard'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
