import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Notification } from './components/Notification';
import { AuthModal } from './components/AuthModal';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { LandingPage } from './pages/LandingPage';
import { Trading } from './pages/Trading';
import { Portfolio } from './pages/Portfolio';
import { Orders } from './pages/Orders';
import { WalletPage } from './pages/Wallet';
import { PortfolioSummary } from './types';
import { api } from './api/client';
import { ShieldCheck, BookOpen, Lock, Sparkles } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, setShowAuthModal, setAuthMode, login } = useAuth();
  // Default to 'trading' if user token exists, otherwise start on 'landing'
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return localStorage.getItem('stocksim_token') ? 'trading' : 'landing';
  });

  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);

  // If user becomes authenticated while on landing page, redirect smoothly to trading terminal
  useEffect(() => {
    if (user && currentTab === 'landing') {
      setCurrentTab('trading');
    }
  }, [user]);

  const fetchPortfolio = async () => {
    if (!user) {
      setSummary(null);
      return;
    }
    try {
      setLoadingSummary(true);
      const data = await api.getPortfolioSummary();
      setSummary(data);
    } catch (e) {
      console.warn('Could not load portfolio summary:', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [user]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const handleSelectStockToTrade = (_symbol: string) => {
    setCurrentTab('trading');
  };

  const handleQuickDemo = async () => {
    try {
      const demoUser = 'demotrader';
      const demoPass = 'DemoPassword123!';
      try {
        await login(demoUser, demoPass);
        setCurrentTab('trading');
        showToast('Logged in as Demo Trader with $100,000 USD virtual balance', 'success');
      } catch {
        // Register demo trader if doesn't exist
        await api.register(demoUser, 'demotrader@stocksim.com', demoPass, 100000);
        await login(demoUser, demoPass);
        setCurrentTab('trading');
        showToast('Created Demo Trader account with $100,000 USD virtual balance', 'success');
      }
    } catch (e: any) {
      showToast(e.message || 'Demo login failed', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenDeposit={() => setIsDepositOpen(true)}
        netWorth={summary ? Number(summary.net_worth) : undefined}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 1. High-Conversion Landing Page */}
        {currentTab === 'landing' && (
          <LandingPage
            onGetStarted={() => {
              setAuthMode('register');
              setShowAuthModal(true);
            }}
            onSignIn={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
            onQuickDemo={handleQuickDemo}
            onPreviewTerminal={() => setCurrentTab('trading')}
          />
        )}

        {/* 2. Trading Terminal (Accessible to Authenticated Users & Guest Preview) */}
        {currentTab === 'trading' && (
          <Trading
            onSuccessToast={(msg) => showToast(msg, 'success')}
            userHoldings={summary ? summary.holdings : []}
            onRefreshData={fetchPortfolio}
          />
        )}

        {/* 3. Protected Portfolio Dashboard */}
        {currentTab === 'portfolio' && (
          user ? (
            <Portfolio
              summary={summary}
              loading={loadingSummary}
              onSelectStockToTrade={handleSelectStockToTrade}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          ) : (
            <div className="py-24 text-center max-w-md mx-auto space-y-5">
              <div className="w-14 h-14 rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-xl">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-black text-white">Portfolio Protected</h2>
                <p className="text-xs text-slate-400">
                  Please sign in or create an account to track your active holdings and net worth.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg transition"
                >
                  Sign In
                </button>
                <button
                  onClick={handleQuickDemo}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-indigo-300 font-bold text-xs transition"
                >
                  Instant Demo
                </button>
              </div>
            </div>
          )
        )}

        {/* 4. Protected Order History */}
        {currentTab === 'orders' && (
          user ? (
            <Orders />
          ) : (
            <div className="py-24 text-center max-w-md mx-auto space-y-5">
              <div className="w-14 h-14 rounded-3xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xl">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-black text-white">Order History Protected</h2>
                <p className="text-xs text-slate-400">
                  Sign in to view your executed market orders and active automated limit orders.
                </p>
              </div>
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg transition"
              >
                Sign In to View Orders
              </button>
            </div>
          )
        )}

        {/* 5. Protected Virtual Wallet */}
        {currentTab === 'wallet' && (
          user ? (
            <WalletPage
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
            />
          ) : (
            <div className="py-24 text-center max-w-md mx-auto space-y-5">
              <div className="w-14 h-14 rounded-3xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-black text-white">Virtual Wallet Protected</h2>
                <p className="text-xs text-slate-400">
                  Sign in to manage your virtual capital and view your complete financial transaction ledger.
                </p>
              </div>
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition"
              >
                Sign In to View Wallet
              </button>
            </div>
          )
        )}
      </main>

      {/* Global Modals & Notifications */}
      <AuthModal onSuccess={(msg) => showToast(msg, 'success')} />
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={(msg) => {
          showToast(msg, 'success');
          fetchPortfolio();
        }}
      />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={(msg) => {
          showToast(msg, 'success');
          fetchPortfolio();
        }}
      />
      <Notification
        message={toastMsg}
        type={toastType}
        onClose={() => setToastMsg(null)}
      />

      {/* Modern Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F19]/90 py-8 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">StockSim v2.0</span>
            <span>•</span>
            <span>Virtual Stock Trading & Portfolio Management Engine</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-emerald-400/80 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              Risk-Free Virtual Paper Trading
            </span>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Swagger API Docs</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;
