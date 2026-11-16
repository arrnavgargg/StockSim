import React, { useState } from 'react';
import { api } from '../api/client';
import { Database, Sparkles, CheckCircle2 } from 'lucide-react';

interface SeedBannerProps {
  onSeeded: () => void;
}

export const SeedBanner: React.FC<SeedBannerProps> = ({ onSeeded }) => {
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);

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

  return (
    <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            Market Instruments Catalog
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded">
              Blue-Chips
            </span>
          </h4>
          <p className="text-xs text-slate-400">
            Seed standard market equities (AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META, NFLX)
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSeed}
        disabled={loading || seeded}
        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-lg shadow-indigo-950/50 transition flex items-center gap-1.5 shrink-0"
      >
        {seeded ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Market Seeded!</span>
          </>
        ) : loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Seeding Stocks...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Seed Blue-Chip Stocks</span>
          </>
        )}
      </button>
    </div>
  );
};
