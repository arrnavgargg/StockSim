import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Sparkles,
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AuthModalProps {
  onSuccess?: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { showAuthModal, setShowAuthModal, authMode, setAuthMode, login, register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCapital, setSelectedCapital] = useState<number>(100000);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  if (!showAuthModal) return null;

  const validateForm = () => {
    if (authMode === 'register') {
      if (!username.trim() || username.trim().length < 3) {
        throw new Error('Username must be at least 3 characters long.');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Please enter a valid email address (e.g., trader@domain.com).');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match. Please re-enter.');
      }
    } else {
      if (!username.trim()) {
        throw new Error('Please enter your username or registered email.');
      }
      if (!password) {
        throw new Error('Please enter your password.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      validateForm();
      setLoading(true);

      if (authMode === 'register') {
        await register(username.trim(), email.trim(), password, selectedCapital);
        if (onSuccess) {
          onSuccess(`Welcome to StockSim, ${username}! Your $${selectedCapital.toLocaleString()} virtual portfolio is active.`);
        }
      } else {
        await login(username.trim(), password);
        if (rememberMe) {
          localStorage.setItem('stocksim_remember', 'true');
        } else {
          localStorage.removeItem('stocksim_remember');
        }
        if (onSuccess) {
          onSuccess(`Welcome back, ${username}! Successfully signed in.`);
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#111827] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800/80 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-emerald-500/30 text-emerald-400 border border-indigo-500/30 mb-3 shadow-lg shadow-indigo-950/30">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {authMode === 'register' ? 'Create Your Trading Account' : 'Welcome Back, Trader'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {authMode === 'register'
              ? 'Join StockSim and receive a ₹10,00,000 INR virtual portfolio'
              : 'Sign in to access your portfolio and execute trades'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setError(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
              authMode === 'login'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
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
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Register (₹10L Bonus)
          </button>
        </div>

        {/* ₹10,00,000 Starter Banner for Registration */}
        {authMode === 'register' && (
          <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-indigo-950/60 border border-emerald-500/30 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-300 block">
                ₹10,00,000 Starter Capital Included
              </span>
              <span className="text-slate-400">
                Risk-free virtual cash automatically deposited upon registration.
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 flex items-start gap-3 text-xs text-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Forgot Password Modal Info */}
        {forgotPasswordNotice && (
          <div className="mb-5 p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-700/60 flex items-start gap-3 text-xs text-indigo-200">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Password Recovery</p>
              <p className="text-slate-300 mt-0.5">
                For educational simulator security, you can use the instant <strong>Quick Demo</strong> button below, or re-register with your email anytime.
              </p>
              <button
                type="button"
                onClick={() => setForgotPasswordNotice(false)}
                className="mt-2 text-[11px] font-bold text-indigo-400 underline hover:text-indigo-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {authMode === 'register' ? 'Choose a Username' : 'Username or Email'}
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={authMode === 'register' ? 'e.g. wallstreet_pro' : 'username or email'}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={() => setForgotPasswordNotice(true)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
                />
              </div>
            </div>
          )}

          {/* Starting Capital Selector on Register */}
          {authMode === 'register' && (
            <div className="pt-1">
              <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center justify-between">
                <span>Select Starting Virtual Capital:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  ${selectedCapital.toLocaleString()} USD
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10000, 50000, 100000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setSelectedCapital(amount)}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all flex flex-col items-center justify-center ${
                      selectedCapital === amount
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>${(amount / 1000).toFixed(0)}k Cash</span>
                    <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                      {amount === 100000 ? 'Recommended' : amount === 50000 ? 'Intermediate' : 'Starter'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Remember Me Checkbox on Login */}
          {authMode === 'login' && (
            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember my session</span>
              </label>

              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium flex items-center gap-1"
              >
                <span>⚡ Auto-fill Demo</span>
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition shadow-lg flex items-center justify-center gap-2 mt-2 ${
              authMode === 'register'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-950/50 text-white'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-indigo-950/50 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : authMode === 'register' ? (
              'Create Account & Claim ₹10,00,000'
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Modal Footer Note */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% simulated paper trading desk with zero real financial risk.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
