import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  BarChart3,
  Clock,
  ArrowRight,
  Star,
  CheckCircle2,
  Sparkles,
  Layers,
  Wallet,
  Activity,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  Award,
  Users,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onQuickDemo: () => void;
  onPreviewTerminal: () => void;
}

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
  onQuickDemo,
  onPreviewTerminal,
}) => {
  // Live simulated ticker data
  const [tickers, setTickers] = useState<TickerItem[]>([
    { symbol: 'AAPL', price: 189.45, change: 4.35, changePercent: 2.35 },
    { symbol: 'NVDA', price: 128.9, change: 5.1, changePercent: 4.12 },
    { symbol: 'TSLA', price: 214.3, change: -2.5, changePercent: -1.15 },
    { symbol: 'MSFT', price: 428.15, change: 6.12, changePercent: 1.45 },
    { symbol: 'AMZN', price: 186.2, change: 5.75, changePercent: 3.2 },
    { symbol: 'GOOGL', price: 172.5, change: 1.45, changePercent: 0.85 },
    { symbol: 'META', price: 502.8, change: 10.3, changePercent: 2.1 },
    { symbol: 'AMD', price: 156.4, change: 4.6, changePercent: 3.05 },
  ]);

  // Minor oscillating price ticks for dynamic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers((prev) =>
        prev.map((item) => {
          const delta = (Math.random() - 0.48) * 0.4;
          const newPrice = Number((item.price + delta).toFixed(2));
          const newChange = Number((item.change + delta).toFixed(2));
          const newPercent = Number(((newChange / (newPrice - newChange)) * 100).toFixed(2));
          return {
            ...item,
            price: newPrice,
            change: newChange,
            changePercent: newPercent,
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-24 py-8 sm:py-14 overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Feature Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-700/50 shadow-lg shadow-indigo-950/40 text-xs font-semibold text-indigo-300 animate-in fade-in slide-in-from-top-4 duration-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>v2.0 Trading Desk • Zero Financial Risk Simulation</span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-emerald-400 font-mono font-bold">$100,000 Starter Cash</span>
        </div>

        {/* Catchy Value Proposition Headline */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Master the Stock Market{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Risk-Free.
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Trade real-world equities with live simulated market quotes, execute instant market & automated limit orders, track portfolio analytics, and build genuine market intuition.
          </p>
        </div>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base shadow-xl shadow-emerald-950/60 hover:shadow-emerald-900/80 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onSignIn}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-base border border-slate-700/80 hover:border-slate-600 shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In</span>
          </button>

          <button
            onClick={onQuickDemo}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 font-bold text-sm border border-indigo-700/60 hover:border-indigo-500 transition-all flex items-center justify-center gap-2"
            title="Instant access with $100,000 pre-loaded demo account"
          >
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>⚡ Instant Demo ($100K)</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Risk-Free Paper Trading</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Instant Order Fill with Zero Slippage</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DYNAMIC ANIMATED TERMINAL PREVIEW GRAPHIC                                */}
        {/* ========================================================================= */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="relative rounded-3xl p-1 bg-gradient-to-b from-indigo-500/30 via-slate-800/40 to-slate-900/80 shadow-2xl shadow-indigo-950/50">
            <div className="rounded-[22px] bg-[#0E1526] border border-slate-800/90 overflow-hidden text-left shadow-inner">
              {/* Browser Window Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#090D18] border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline">
                    stocksim.app/terminal • live-simulation
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Market Continuous
                  </span>
                  <button
                    onClick={onPreviewTerminal}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                  >
                    Launch Live Desk →
                  </button>
                </div>
              </div>

              {/* Mock Terminal Workspace */}
              <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Mini Market List */}
                <div className="lg:col-span-4 bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Market Watch
                    </span>
                    <span className="text-[10px] bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                      8 Equities
                    </span>
                  </div>

                  <div className="space-y-2">
                    {tickers.slice(0, 4).map((t, idx) => (
                      <div
                        key={t.symbol}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          idx === 0
                            ? 'bg-indigo-950/50 border-indigo-500/60 shadow-md'
                            : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Star className={`w-3.5 h-3.5 ${idx < 2 ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                          <div>
                            <span className="text-xs font-bold text-white font-mono block">
                              {t.symbol}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {t.symbol === 'AAPL' ? 'Apple Inc.' : t.symbol === 'NVDA' ? 'NVIDIA Corp.' : t.symbol === 'TSLA' ? 'Tesla Inc.' : 'Microsoft'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-white block">
                            ${t.price.toFixed(2)}
                          </span>
                          <span
                            className={`text-[10px] font-mono flex items-center justify-end gap-0.5 ${
                              t.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {t.change >= 0 ? '+' : ''}
                            {t.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Interactive Chart & Ticket Preview */}
                <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                  {/* Stock Header & Stats */}
                  <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white font-mono">AAPL</h3>
                        <span className="text-xs text-slate-400 font-sans">Apple Inc. — NASDAQ</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-white font-mono">$189.45</span>
                        <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-0.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +$4.35 (+2.35%)
                        </span>
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Simulated Wallet</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">$100,000.00 USD</span>
                    </div>
                  </div>

                  {/* Mock SVG Interactive Line Chart */}
                  <div className="relative h-44 w-full bg-slate-900/30 rounded-2xl border border-slate-800/80 p-3 overflow-hidden flex flex-col justify-end">
                    {/* SVG Chart Graphic */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,100 Q60,70 120,80 T240,40 T360,60 T450,20 L500,15 L500,120 L0,120 Z"
                        fill="url(#chartGradient)"
                      />
                      <path
                        d="M0,100 Q60,70 120,80 T240,40 T360,60 T450,20 L500,15"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                      />
                      <circle cx="500" cy="15" r="4" fill="#10B981" className="animate-ping" />
                      <circle cx="500" cy="15" r="4" fill="#10B981" />
                    </svg>

                    {/* Chart Overlay Badge */}
                    <div className="absolute top-3 left-4 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        1D High: $191.20
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        1D Low: $184.80
                      </span>
                    </div>
                  </div>

                  {/* Live Order Fill Notice Banner */}
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-200">
                        <strong>Order #1084 Triggered & Filled:</strong> Auto-Buy 15 shares AAPL @ $189.45
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/20 hidden sm:inline">
                      Instant Settlement
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. LIVE MARKET TICKER BANNER                                              */}
      {/* ========================================================================= */}
      <section className="relative border-y border-slate-800/80 bg-[#090D18]/90 py-3.5 overflow-hidden">
        <div className="animate-ticker">
          {[...tickers, ...tickers].map((t, idx) => (
            <div
              key={`${t.symbol}-${idx}`}
              className="inline-flex items-center gap-3 px-6 py-1 border-r border-slate-800/80 shrink-0 font-mono text-xs cursor-pointer hover:bg-slate-800/40 transition rounded-lg"
              onClick={onGetStarted}
            >
              <span className="font-bold text-white">{t.symbol}</span>
              <span className="text-slate-300 font-medium">${t.price.toFixed(2)}</span>
              <span
                className={`flex items-center text-[11px] font-bold ${
                  t.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {t.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {t.change >= 0 ? '+' : ''}
                {t.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. KEY FEATURES SECTION (PILLARS GRID)                                    */}
      {/* ========================================================================= */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Engineered for Serious Traders
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Everything you need to practice equity execution, manage risk, and test complex trading mechanics without financial exposure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="group p-8 rounded-3xl bg-[#111827]/70 border border-slate-800/90 hover:border-indigo-500/50 hover:bg-[#111827] transition-all shadow-xl hover:shadow-indigo-950/30 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                Real-Time Market Watch & Watchlist
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Browse leading US equities with instant search, live price changes, and 1-click star toggling to filter and monitor your personal watchlist.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-800/60 mt-6 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Explore Market Quotes</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group p-8 rounded-3xl bg-[#111827]/70 border border-slate-800/90 hover:border-emerald-500/50 hover:bg-[#111827] transition-all shadow-xl hover:shadow-emerald-950/30 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <SlidersHorizontal className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Autonomous Limit Orders Engine
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Set target buy and sell price triggers. When market prices cross your targets, StockSim&apos;s background engine automatically fills the order without manual intervention.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-800/60 mt-6 flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Automate Your Trades</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group p-8 rounded-3xl bg-[#111827]/70 border border-slate-800/90 hover:border-purple-500/50 hover:bg-[#111827] transition-all shadow-xl hover:shadow-purple-950/30 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                Virtual Capital & Immutable Ledger
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Start with up to $100,000 in virtual cash. Every deposit, withdrawal, and trade is recorded in an immutable financial transaction ledger for full auditability.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-800/60 mt-6 flex items-center text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Manage Cash & Capital</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Feature 4 */}
          <div className="group p-8 rounded-3xl bg-[#111827]/70 border border-slate-800/90 hover:border-cyan-500/50 hover:bg-[#111827] transition-all shadow-xl hover:shadow-cyan-950/30 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                Deep Portfolio Analytics & P&L
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Live net worth computation, weighted average buy price cost-basis accounting, and real-time unrealized dollar & percentage gain/loss tracking per position.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-800/60 mt-6 flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
              <span>View Portfolio Metrics</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Feature 5 */}
          <div className="group p-8 rounded-3xl bg-[#111827]/70 border border-slate-800/90 hover:border-amber-500/50 hover:bg-[#111827] transition-all shadow-xl hover:shadow-amber-950/30 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                Interactive Intraday Charts
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Inspect stock movements with responsive SVG charting, day high/low markers, previous close benchmarks, and real-time quote refresh every 10 seconds.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-800/60 mt-6 flex items-center text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Inspect Price Action</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Feature 6 */}
          <div className="group p-8 rounded-3xl bg-[#111827]/70 border border-slate-800/90 hover:border-emerald-500/50 hover:bg-[#111827] transition-all shadow-xl hover:shadow-emerald-950/30 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                100% Risk-Free Academic Quality
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Built with strict ACID transaction guarantees, defensive invariants preventing negative balances, and full REST API coverage for college & capstone projects.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-800/60 mt-6 flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Verified Test Suite</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. STATS & METRICS SECTION                                                */}
      {/* ========================================================================= */}
      <section id="stats" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
            <div className="space-y-2 pt-4 lg:pt-0">
              <span className="text-3xl sm:text-5xl font-black text-white font-mono block">
                $100,000
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">
                Starter Virtual Capital
              </span>
            </div>

            <div className="space-y-2 pt-4 lg:pt-0">
              <span className="text-3xl sm:text-5xl font-black text-emerald-400 font-mono block">
                &lt; 50ms
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">
                Order Match Latency
              </span>
            </div>

            <div className="space-y-2 pt-4 lg:pt-0">
              <span className="text-3xl sm:text-5xl font-black text-indigo-400 font-mono block">
                100%
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">
                Risk-Free Paper Trading
              </span>
            </div>

            <div className="space-y-2 pt-4 lg:pt-0">
              <span className="text-3xl sm:text-5xl font-black text-amber-400 font-mono block">
                16 / 16
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">
                Automated Tests Passed
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TESTIMONIALS SECTION                                                   */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
            Trader Feedback
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Trusted by Aspiring Traders & Students
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              &quot;The automated Limit Orders feature is incredible. Setting a buy trigger for NVDA and watching it auto-fill on simulated price dips gave me real market intuition.&quot;
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
              <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-xs text-indigo-300">
                AK
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Alex Kim</span>
                <span className="text-[11px] text-slate-400">Finance & CS Undergraduate</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              &quot;StockSim feels like a real Wall Street terminal. The Watchlist, real-time charts, and Net Worth breakdown make practicing strategies stress-free.&quot;
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
              <div className="w-9 h-9 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-300">
                SR
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Sarah Reynolds</span>
                <span className="text-[11px] text-slate-400">Retail Swing Trader</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              &quot;From a software engineering perspective, the 3NF database schema, FastAPI backend, and Pytest coverage make this an exemplary college capstone project.&quot;
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
              <div className="w-9 h-9 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-xs text-purple-300">
                DR
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Prof. David Ross</span>
                <span className="text-[11px] text-slate-400">Software Engineering Faculty</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BOTTOM CALL-TO-ACTION BANNER                                           */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-emerald-950/60 via-indigo-950/70 to-slate-900 border border-emerald-500/40 shadow-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Award className="w-4 h-4" />
            <span>Zero Real Money Required • Instant Setup</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Build Your Trading Confidence?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Join StockSim today. Receive up to $100,000 in virtual trading capital and begin practicing equity orders immediately.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-xl shadow-emerald-950/60 transition flex items-center justify-center gap-2 group"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onQuickDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-indigo-300 font-bold text-base border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Launch 1-Click Demo</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
