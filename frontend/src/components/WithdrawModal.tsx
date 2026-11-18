import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { X, ArrowUpCircle, AlertCircle } from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { walletBalance, refreshUser } = useAuth();
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Withdrawal amount must be greater than ₹0.');
      return;
    }

    if (amount > walletBalance) {
      setError(`Cannot withdraw ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}: Available balance is ₹${walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.withdraw(amount);
      await refreshUser();
      onSuccess(`Successfully withdrew ₹${amount.toLocaleString('en-IN')} from your wallet!`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePercentage = (pct: number) => {
    const calculated = Math.floor(walletBalance * pct);
    setAmount(Math.max(1, calculated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3 shadow-lg">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">Withdraw Funds</h2>
          <p className="text-xs text-slate-400 mt-1">
            Available to withdraw: <span className="text-emerald-400 font-mono font-bold">₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Withdrawal Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-lg font-bold">
                ₹
              </span>
              <input
                type="number"
                min="1"
                max={walletBalance}
                step="1"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-lg font-bold text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Quick Percentage Chips */}
          <div className="grid grid-cols-4 gap-2">
            {[0.25, 0.5, 0.75, 1.0].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentage(pct)}
                className="py-2 text-xs font-mono font-semibold rounded-lg border bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700 transition"
              >
                {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || walletBalance <= 0 || amount > walletBalance}
            className="w-full mt-4 py-3.5 rounded-xl text-sm font-bold tracking-wide bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black shadow-lg shadow-amber-950/50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Processing Withdrawal...
              </span>
            ) : (
              `Confirm Withdrawal of ₹${amount.toLocaleString('en-IN')}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
