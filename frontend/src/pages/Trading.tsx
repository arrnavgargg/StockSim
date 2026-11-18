import React, { useState, useEffect } from 'react';
import { Instrument, Quote, PortfolioHoldingItem } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StockChart } from '../components/StockChart';
import { TradingCard } from '../components/TradingCard';
import { SeedBanner } from '../components/SeedBanner';
import {
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  CheckCircle,
  Star,
} from 'lucide-react';

interface TradingProps {
  onSuccessToast: (msg: string) => void;
  userHoldings: PortfolioHoldingItem[];
  onRefreshData: () => void;
}

export const Trading: React.FC<TradingProps> = ({
  onSuccessToast,
  userHoldings,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [search, setSearch] = useState<string>('');
  const [loadingInstruments, setLoadingInstruments] = useState<boolean>(true);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [watchedSymbols, setWatchedSymbols] = useState<string[]>([]);
  const [activeWatchTab, setActiveWatchTab] = useState<'all' | 'watchlist'>('all');

  // Fetch instruments catalog
  const fetchInstruments = async () => {
    try {
      setLoadingInstruments(true);
      let list = await api.listInstruments(search);
      // If catalog is empty, auto-seed
      if (list.length === 0 && !search) {
        list = await api.seedInstruments();
      }
      setInstruments(list);

      // Default select AAPL or first item
      if (list.length > 0 && !selectedInstrument) {
        const defaultInst = list.find((i) => i.symbol === 'AAPL') || list[0];
        setSelectedSymbol(defaultInst.symbol);
        setSelectedInstrument(defaultInst);
      }
    } catch (e) {
      console.error('Error listing instruments:', e);
    } finally {
      setLoadingInstruments(false);
    }
  };

  useEffect(() => {
    fetchInstruments();
  }, [search]);

  // Fetch quote when selectedSymbol changes
  const fetchQuote = async () => {
    if (!selectedSymbol) return;
    try {
      setLoadingQuote(true);
      const q = await api.getQuote(selectedSymbol);
      setSelectedQuote(q);
    } catch (e) {
      console.error('Error fetching quote:', e);
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    fetchQuote();
    // Poll quote every 10s for live market feel
    const interval = setInterval(fetchQuote, 10000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Fetch watchlist symbols
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (user) {
        try {
          const syms = await api.getWatchedSymbols();
          setWatchedSymbols(syms);
        } catch (e) {
          console.error('Error fetching watchlist symbols:', e);
        }
      } else {
        const saved = localStorage.getItem('stocksim_watchlist');
        if (saved) {
          try {
            setWatchedSymbols(JSON.parse(saved));
          } catch (e) {
            console.error('Error loading watchlist from localStorage:', e);
          }
        }
      }
    };
    fetchWatchlist();
  }, [user]);

  const handleToggleWatchlist = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isWatched = watchedSymbols.includes(symbol);
    const updated = isWatched
      ? watchedSymbols.filter((s) => s !== symbol)
      : [...watchedSymbols, symbol];
    setWatchedSymbols(updated);

    if (user) {
      try {
        const res = await api.toggleWatchlist(symbol);
        onSuccessToast(res.message);
      } catch (err: any) {
        setWatchedSymbols(watchedSymbols);
        onSuccessToast(err.response?.data?.detail || err.message || 'Failed to update watchlist');
      }
    } else {
      localStorage.setItem('stocksim_watchlist', JSON.stringify(updated));
      onSuccessToast(
        isWatched ? `Removed ${symbol} from watchlist` : `Saved ${symbol} to watchlist`
      );
    }
  };

  const displayedInstruments =
    activeWatchTab === 'watchlist'
      ? instruments.filter((i) => watchedSymbols.includes(i.symbol))
      : instruments;

  const handleSelectInstrument = (inst: Instrument) => {
    setSelectedSymbol(inst.symbol);
    setSelectedInstrument(inst);
  };

  const currentHolding = userHoldings.find((h) => h.symbol === selectedSymbol);

  return (
    <div className="space-y-6">
      {/* Seed banner if needed */}
      <SeedBanner onSeeded={fetchInstruments} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Market Watchlist (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Market Watch
                </h3>
              </div>
              <button
                onClick={fetchInstruments}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Refresh market catalog"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingInstruments ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Watchlist Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800/80 my-3 text-xs">
              <button
                type="button"
                onClick={() => setActiveWatchTab('all')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition ${
                  activeWatchTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                All Stocks ({instruments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveWatchTab('watchlist')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                  activeWatchTab === 'watchlist'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    activeWatchTab === 'watchlist'
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-400'
                  }`}
                />
                <span>Watchlist ({watchedSymbols.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticker or company..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Instrument List */}
            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
              {loadingInstruments && instruments.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Loading instruments...
                </div>
              ) : displayedInstruments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                  {activeWatchTab === 'watchlist' ? (
                    <div className="p-4">
                      <Star className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-slate-300">Watchlist is empty</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Click the star icon next to any stock in &quot;All Stocks&quot; to save it here.
                      </p>
                    </div>
                  ) : (
                    <div>No stocks match &quot;{search}&quot;</div>
                  )}
                </div>
              ) : (
                displayedInstruments.map((inst) => {
                  const isSelected = inst.symbol === selectedSymbol;
                  const price = Number(inst.current_price);
                  const holding = userHoldings.find((h) => h.symbol === inst.symbol);
                  const isWatched = watchedSymbols.includes(inst.symbol);

                  return (
                    <div
                      key={inst.id}
                      onClick={() => handleSelectInstrument(inst)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between group ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/30'
                          : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => handleToggleWatchlist(inst.symbol, e)}
                          className="p-1 rounded-md hover:bg-slate-800/80 transition"
                          title={isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        >
                          <Star
                            className={`w-4 h-4 transition-transform hover:scale-110 ${
                              isWatched
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-600 hover:text-amber-400'
                            }`}
                          />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white font-mono">
                              {inst.symbol}
                            </span>
                            {holding && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.2 rounded border border-emerald-500/30">
                                {holding.quantity} sh
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-[130px]">
                            {inst.company_name}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold font-mono text-sm text-slate-100 block">
                          ${price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-0.5">
                          <TrendingUp className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chart & Trading Ticket (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          {/* Real-time Interactive Stock Chart */}
          <StockChart quote={selectedQuote} height={360} />

          {/* Bottom Grid: Order Execution Ticket + Holding Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TradingCard
              instrument={selectedInstrument}
              userHolding={currentHolding}
              onOrderSuccess={(msg) => {
                onSuccessToast(msg);
                onRefreshData();
                fetchQuote();
                fetchInstruments();
              }}
              onPriceSimulated={() => {
                fetchInstruments();
                fetchQuote();
                onRefreshData();
              }}
            />

            {/* Stock Fundamentals & Position Insight Card */}
            <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide pb-4 border-b border-slate-800 flex items-center justify-between">
                  <span>Position & Fundamentals</span>
                  <span className="text-xs font-mono text-slate-400 font-normal">
                    {selectedSymbol}
                  </span>
                </h3>

                {currentHolding ? (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Position Status</span>
                      <span className="text-emerald-400 font-semibold font-mono flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active Position
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Shares Owned</span>
                      <span className="font-mono font-bold text-white">
                        {currentHolding.quantity} shares
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Avg Cost Basis</span>
                      <span className="font-mono text-slate-200">
                        ${Number(currentHolding.average_buy_price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Current Value</span>
                      <span className="font-mono text-slate-200">
                        ${Number(currentHolding.current_value).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-500/20">
                      <span className="text-slate-300 font-medium">Unrealized P&L</span>
                      <span
                        className={`font-mono font-bold ${
                          Number(currentHolding.unrealized_pnl) >= 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {Number(currentHolding.unrealized_pnl) >= 0 ? '+' : ''}$
                        {Number(currentHolding.unrealized_pnl).toFixed(2)} (
                        {Number(currentHolding.unrealized_pnl_percent).toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">
                      You currently hold 0 shares of {selectedSymbol}.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Use the order ticket to buy your first position.
                    </p>
                  </div>
                )}

                {/* Instrument Metadata */}
                <div className="mt-5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Asset Class</span>
                    <span className="text-slate-200 font-mono">US Equity (Common Stock)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Currency</span>
                    <span className="text-slate-200 font-mono">USD ($)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Market Status</span>
                    <span className="text-emerald-400 font-mono font-semibold">● Open / Continuous</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
                Simulated execution with instant fill & zero slippage.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
