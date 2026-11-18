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
      // Try logging into a demo account or register one
      const demoUser = 'demotrader';
      const demoPass = 'DemoPassword123!';
      try {
        await login(demoUser, demoPass);
      } catch {
        // If demo user doesn't exist, register
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: demoUser,
            email: 'demotrader@stocksim.com',
            password: demoPass,
          }),
        });
        if (res.ok) {
          await login(demoUser, demoPass);
        }
      }
    } catch (e) {
      console.error('Demo login error:', e);
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
              onClick={() => onTabChange('trading')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-950/40 group-hover:scale-105 transition-transform">
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

            {/* Navigation Tabs */}
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
            </div>
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
                    onClick={logout}
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
                  className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-700/50 hover:bg-indigo-900/60 transition"
                >
                  ⚡ Demo Trader
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

        {/* Mobile Navigation Tabs */}
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
        </div>
      </div>
    </nav>
  );
};
