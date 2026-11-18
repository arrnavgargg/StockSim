import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { X, ArrowDownCircle, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { refreshUser } = useAuth();
  const [amount, setAmount] = useState<number>(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [5000, 10000, 50000, 100000];

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Deposit amount must be greater than ₹0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.deposit(amount);
      await refreshUser();
      onSuccess(`Successfully deposited ₹${amount.toLocaleString('en-IN')} virtual funds into your wallet!`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Deposit failed.');
    } finally {
      setLoading(false);
    }
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3 shadow-lg">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">Deposit Virtual Funds</h2>
          <p className="text-xs text-slate-400 mt-1">
            Top up your trading wallet with instant simulation capital
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Deposit Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-lg font-bold">
                ₹
              </span>
              <input
                type="number"
                min="1"
                max="10000000"
                step="1"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-lg font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`py-2 text-xs font-mono font-semibold rounded-lg border transition ${
                  amount === preset
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                +₹{preset.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 rounded-xl text-sm font-bold tracking-wide bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Deposit...
              </span>
            ) : (
              `Confirm Deposit of ₹${amount.toLocaleString('en-IN')}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
