import React, { useState } from 'react';
import { PortfolioSummary, PortfolioHoldingItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Wallet,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

interface PortfolioProps {
  summary: PortfolioSummary | null;
  loading: boolean;
  onSelectStockToTrade: (symbol: string) => void;
  onOpenDeposit: () => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({
  summary,
  loading,
  onSelectStockToTrade,
  onOpenDeposit,
}) => {
  const { user, walletBalance, setShowAuthModal, setAuthMode } = useAuth();

  if (!user) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto bg-[#111827]/80 rounded-3xl border border-slate-800 p-8 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
          <PieChart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Track Your Investment Portfolio</h2>
        <p className="text-xs text-slate-400 mt-2">
          Sign in or create a trader account to view your net worth, unrealized P&L, and asset breakdown.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setAuthMode('register');
              setShowAuthModal(true);
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 transition"
          >
            Claim $10,000 Portfolio
          </button>
        </div>
      </div>
    );
  }

  const netWorth = summary ? Number(summary.net_worth) : walletBalance;
  const stockValue = summary ? Number(summary.current_portfolio_value) : 0;
  const totalInvested = summary ? Number(summary.total_invested) : 0;
  const totalPnl = summary ? Number(summary.total_unrealized_pnl) : 0;
  const totalReturnPct = summary ? Number(summary.total_return_percent) : 0;
  const holdings = summary ? summary.holdings : [];

  const isProfit = totalPnl >= 0;

  // Calculate allocation percentages
  const cashPct = netWorth > 0 ? (walletBalance / netWorth) * 100 : 100;
  const stocksPct = netWorth > 0 ? (stockValue / netWorth) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Portfolio KPI Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth Card */}
        <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Net Worth</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span>Cash: ${(walletBalance).toFixed(2)}</span>
            <span>•</span>
            <span>Equities: ${stockValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Unrealized P&L Card */}
        <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Unrealized Return</span>
            <div
              className={`p-2 rounded-xl ${
                isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}
            >
              {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div
            className={`mt-2 text-2xl font-black font-mono ${
              isProfit ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isProfit ? '+' : ''}${totalPnl.toFixed(2)}
          </div>
          <div className="mt-2 text-xs flex items-center gap-1.5">
            <span
              className={`font-semibold font-mono ${
                isProfit ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isProfit ? '+' : ''}{totalReturnPct.toFixed(2)}%
            </span>
            <span className="text-slate-400">overall return</span>
          </div>
        </div>

        {/* Invested Cost Card */}
        <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Invested Capital</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Current Equity Value: ${stockValue.toFixed(2)}
          </div>
        </div>

        {/* Cash Balance with Top-up */}
        <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Available Cash</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">
              ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <button
            onClick={onOpenDeposit}
            className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition flex items-center justify-center gap-1.5"
          >
            <span>+ Deposit Virtual Funds</span>
          </button>
        </div>
      </div>

      {/* Asset Allocation Bar */}
      <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            Asset Allocation
          </span>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Cash ({cashPct.toFixed(1)}%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              Equities ({stocksPct.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Progress Bar Visual */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${cashPct}%` }}
            title={`Cash: ${cashPct.toFixed(1)}%`}
          />
          <div
            className="bg-indigo-500 h-full transition-all duration-500"
            style={{ width: `${stocksPct}%` }}
            title={`Equities: ${stocksPct.toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Active Holdings Table */}
      <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Active Positions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live mark-to-market positions and unrealized profit/loss
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-slate-800 text-slate-300 rounded-lg">
            {holdings.length} {holdings.length === 1 ? 'Holding' : 'Holdings'}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Loading portfolio holdings...
          </div>
        ) : holdings.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">No Open Positions</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Your portfolio has no active stock holdings. Head over to the Trading Terminal to place your first trade!
            </p>
            <button
              onClick={() => onSelectStockToTrade('AAPL')}
              className="mt-5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-950/50 transition inline-flex items-center gap-1.5"
            >
              <span>Explore Market & Trade</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-medium uppercase tracking-wider border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Avg Buy Price</th>
                  <th className="py-3 px-4">Market Price</th>
                  <th className="py-3 px-4">Total Cost</th>
                  <th className="py-3 px-4">Market Value</th>
                  <th className="py-3 px-4">Unrealized P&L</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {holdings.map((h) => {
                  const pnl = Number(h.unrealized_pnl);
                  const pnlPct = Number(h.unrealized_pnl_percent);
                  const isPos = pnl >= 0;

                  return (
                    <tr
                      key={h.symbol}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-sans">
                        <span className="font-bold font-mono text-sm text-white block">
                          {h.symbol}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[150px] block">
                          {h.company_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-semibold">
                        {h.quantity} shares
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        ${Number(h.average_buy_price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-white font-bold">
                        ${Number(h.current_price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        ${Number(h.total_invested).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-100 font-semibold">
                        ${Number(h.current_value).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            isPos ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isPos ? '+' : ''}${pnl.toFixed(2)} ({isPos ? '+' : ''}
                          {pnlPct.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <button
                          onClick={() => onSelectStockToTrade(h.symbol)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition inline-flex items-center gap-1"
                        >
                          <span>Trade</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
