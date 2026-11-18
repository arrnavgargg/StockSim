import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Database, Sparkles, CheckCircle2, RefreshCw, LogIn, ExternalLink } from 'lucide-react';
import { PaytmStatus } from '../types';

interface SeedBannerProps {
  onSeeded: () => void;
}

export const SeedBanner: React.FC<SeedBannerProps> = ({ onSeeded }) => {
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [paytmStatus, setPaytmStatus] = useState<PaytmStatus | null>(null);

  useEffect(() => {
    checkPaytmStatus();
  }, []);

  const checkPaytmStatus = async () => {
    try {
      const status = await api.getPaytmStatus();
      setPaytmStatus(status);
    } catch {
      // Ignore
    }
  };

  const handleSeed = async () => {
    try {
      setLoading(true);
      await api.seedInstruments();
      setSeeded(true);
      onSeeded();
      setTimeout(() => setSeeded(false), 4000);
    } catch (e) {
      console.error('Failed to seed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPrices = async () => {
    try {
      setSyncing(true);
      const res = await api.syncPaytmPrices();
      setSyncMessage(`Synced ${res.synced_count} stocks (${res.source.toUpperCase()})`);
      onSeeded();
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (e: any) {
      setSyncMessage(e.detail || 'Sync failed');
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-800/40 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-white">Market Instruments Catalog</h4>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded">
              NSE / BSE (3,000+ Stocks)
            </span>
            {paytmStatus?.authenticated ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-medium px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Paytm Money: LIVE Feed ({paytmStatus.feed})
              </span>
            ) : paytmStatus?.configured ? (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-medium px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Paytm Money: Daily Auth Required
              </span>
            ) : (
              <span className="text-[10px] bg-slate-800 text-slate-400 font-medium px-2 py-0.5 rounded border border-slate-700/60">
                Paytm Money: Simulated Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Indian equities (RELIANCE, TCS, INFY, HDFC) powered by Paytm Money Open API
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
        {/* Daily Paytm Login Button if configured but not authenticated */}
        {paytmStatus?.configured && !paytmStatus?.authenticated && (
          <a
            href="http://127.0.0.1:8000/api/paytm/login"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shrink-0 shadow-sm shadow-emerald-950/50"
            title="Generate daily token via Paytm Money login"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Paytm Daily Login</span>
          </a>
        )}

        {/* Price Sync Button */}
        <button
          type="button"
          onClick={handleSyncPrices}
          disabled={syncing}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 transition flex items-center gap-1.5 shrink-0 shadow-sm"
          title="Fetch latest stock quotes from Paytm Money"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncMessage || (syncing ? 'Syncing...' : 'Sync Live Prices')}</span>
        </button>

        {/* Seed Catalog Button */}
        <button
          type="button"
          onClick={handleSeed}
          disabled={loading || seeded}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-lg shadow-indigo-950/50 transition flex items-center gap-1.5 shrink-0"
        >
          {seeded ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Seeded!</span>
            </>
          ) : loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Seeding...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Seed Indian Blue-Chips</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
