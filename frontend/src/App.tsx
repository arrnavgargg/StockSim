import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Notification } from './components/Notification';
import { AuthModal } from './components/AuthModal';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { Trading } from './pages/Trading';
import { Portfolio } from './pages/Portfolio';
import { Orders } from './pages/Orders';
import { WalletPage } from './pages/Wallet';
import { PortfolioSummary, PortfolioHoldingItem } from './types';
import { api } from './api/client';
import { ShieldCheck, Heart, Github, BookOpen } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('trading');
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);

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

  const handleSelectStockToTrade = (symbol: string) => {
    setCurrentTab('trading');
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
        {currentTab === 'trading' && (
          <Trading
            onSuccessToast={(msg) => showToast(msg, 'success')}
            userHoldings={summary ? summary.holdings : []}
            onRefreshData={fetchPortfolio}
          />
        )}

        {currentTab === 'portfolio' && (
          <Portfolio
            summary={summary}
            loading={loadingSummary}
            onSelectStockToTrade={handleSelectStockToTrade}
            onOpenDeposit={() => setIsDepositOpen(true)}
          />
        )}

        {currentTab === 'orders' && <Orders />}

        {currentTab === 'wallet' && (
          <WalletPage
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
          />
        )}
      </main>

      {/* Global Modals & Toasts */}
      <AuthModal />
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
      <footer className="border-t border-slate-800/80 bg-[#0B0F19]/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">StockSim v1.0.0</span>
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
