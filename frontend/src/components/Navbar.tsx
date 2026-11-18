import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  LayoutDashboard,
  Wallet,
  Clock,
  LogOut,
  User,
  PlusCircle,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Home,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenDeposit: () => void;
  netWorth?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenDeposit,
  netWorth,
}) => {
  const { user, walletBalance, logout, setShowAuthModal, setAuthMode, login } = useAuth();
  const [apiOnline, setApiOnline] = useState<boolean>(true);

  // Periodic health ping
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        setApiOnline(res.ok);
      } catch {
        setApiOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickDemo = async () => {
    try {
      const demoUser = 'demotrader';
      const demoPass = 'DemoPassword123!';
      try {
        await login(demoUser, demoPass);
        onTabChange('trading');
      } catch {
        // If demo user doesn't exist, register
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: demoUser,
            email: 'demotrader@stocksim.com',
            password: demoPass,
            initial_capital: 100000,
          }),
        });
        if (res.ok) {
          await login(demoUser, demoPass);
          onTabChange('trading');
        }
      }
    } catch (e) {
      console.error('Demo login error:', e);
    }
  };

  const handleLogout = () => {
    logout();
    onTabChange('landing');
  };

  const scrollToSection = (id: string) => {
    if (currentTab !== 'landing') {
      onTabChange('landing');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo & Navigation Links */}
          <div className="flex items-center gap-8">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onTabChange(user ? 'trading' : 'landing')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-950/40 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-wider text-white">
                    Stock<span className="text-emerald-400">Sim</span>
                  </span>
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}
                    title={apiOnline ? 'API Connected' : 'API Offline'}
                  />
                </div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block -mt-1">
                  Virtual Trading Desk
                </span>
              </div>
            </div>

            {/* Navigation Tabs - Authenticated vs Unauthenticated */}
            {user ? (
              <div className="hidden md:flex items-center space-x-1">
                <button
                  onClick={() => onTabChange('trading')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    currentTab === 'trading'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Terminal
                </button>

                <button
                  onClick={() => onTabChange('portfolio')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    currentTab === 'portfolio'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                  Portfolio
                </button>

                <button
                  onClick={() => onTabChange('orders')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    currentTab === 'orders'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  Orders
                </button>

                <button
                  onClick={() => onTabChange('wallet')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    currentTab === 'wallet'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  Wallet
                </button>

                <button
                  onClick={() => onTabChange('landing')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-all ${
                    currentTab === 'landing' ? 'bg-slate-800 text-white' : ''
                  }`}
                  title="View Landing Page"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-1 text-xs">
                <button
                  onClick={() => onTabChange('landing')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    currentTab === 'landing' ? 'text-white bg-slate-800/60' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('stats')}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition"
                >
                  Metrics
                </button>
                <button
                  onClick={() => onTabChange('trading')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    currentTab === 'trading'
                      ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terminal (Guest)</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Auth & Financial Balance Badges */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Net Worth (if computed) */}
                {netWorth !== undefined && (
                  <div className="hidden lg:flex flex-col items-end px-3 py-1 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Net Worth</span>
                    <span className="text-xs font-mono font-bold text-white">
                      ₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Cash Balance with Deposit Action */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 pl-3 shadow-inner">
                  <div className="flex flex-col mr-3">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Available Cash</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    onClick={onOpenDeposit}
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                    title="Deposit virtual funds"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* User Profile Pill */}
                <div className="flex items-center gap-2 pl-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300 uppercase">
                    {user.username.slice(0, 2)}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-200">
                    {user.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuickDemo}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-700/50 hover:bg-indigo-900/60 transition shadow"
                  title="Log in with demo account"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Demo Trader</span>
                </button>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5"
                >
                  <span>Start with ₹10,00,000</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs (when logged in) */}
        {user && (
          <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80">
            <button
              onClick={() => onTabChange('trading')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                currentTab === 'trading' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Terminal
            </button>
            <button
              onClick={() => onTabChange('portfolio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                currentTab === 'portfolio' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => onTabChange('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                currentTab === 'orders' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => onTabChange('wallet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                currentTab === 'wallet' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Wallet
            </button>
            <button
              onClick={() => onTabChange('landing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                currentTab === 'landing' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Home
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
