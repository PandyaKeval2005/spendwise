import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [monthlySalary, setMonthlySalary] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await signup({
          email: email.trim(),
          password,
          displayName: displayName.trim() || 'User',
          currency: 'INR',
          currencySymbol: '₹',
          monthlySalary: monthlySalary ? parseFloat(monthlySalary) : 0,
          openingBalance: openingBalance ? parseFloat(openingBalance) : 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: 'priya' | 'new') => {
    if (type === 'priya') {
      setIsLogin(true);
      setEmail('priya@spendwise.app');
      setPassword('password123');
    } else {
      setIsLogin(false);
      setDisplayName('Aarav Mehta');
      setEmail(`aarav.${Date.now().toString().slice(-4)}@spendwise.app`);
      setPassword('securePass123');
      setMonthlySalary('45000');
      setOpeningBalance('10000');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-white">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/25 mb-4">
          <Wallet className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          SpendWise
        </h1>
        <p className="text-xs sm:text-sm text-emerald-300 font-semibold mt-1">
          Personal Salary & Expense Manager
        </p>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-slate-900 py-8 px-6 sm:px-8 rounded-3xl shadow-2xl border border-slate-100">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isLogin
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                !isLogin
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name / Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Priya Sharma"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {loading ? 'Authenticating...' : isLogin ? 'Sign In to SpendWise' : 'Complete Registration'}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Test Fill</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('new')}
                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center"
              >
                New User Sample
              </button>
            </div>
          </div>
        </div>

        {/* Security Assurance Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strict user isolation • Bank credentials never requested</span>
        </div>
      </div>
    </div>
  );
};
