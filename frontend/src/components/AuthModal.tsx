import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, ShieldCheck, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, authMode, setAuthMode, login, register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === 'register') {
        if (!email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }
        await register(username.trim(), email.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      setShowAuthModal(false);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setUsername('demotrader');
    setPassword('DemoPassword123!');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-3 shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {authMode === 'register' ? 'Create Trader Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {authMode === 'register'
              ? 'Join StockSim and receive a $10,000 USD virtual portfolio'
              : 'Sign in to access your portfolio and execute trades'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              authMode === 'login'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              authMode === 'register'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register ($10K Bonus)
          </button>
        </div>

        {/* $10,000 Starter Banner for Registration */}
        {authMode === 'register' && (
          <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-indigo-950/60 border border-emerald-500/30 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-300 block">
                $10,000 Starter Capital Included
              </span>
              <span className="text-slate-400">
                Risk-free virtual cash automatically deposited upon registration.
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800/80 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Username
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. wallstreet_bull"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@domain.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {authMode === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition underline underline-offset-2"
              >
                Use demo account credentials
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide transition shadow-lg ${
              authMode === 'register'
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-950/50 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-950/50 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : authMode === 'register' ? (
              'Create Account & Claim $10,000'
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
