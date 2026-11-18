import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Wallet as WalletIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface WalletProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const WalletPage: React.FC<WalletProps> = ({ onOpenDeposit, onOpenWithdraw }) => {
  const { user, walletBalance } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getTransactions(50);
      setTransactions(data);
    } catch (e) {
      console.error('Error fetching transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, walletBalance]);

  return (
    <div className="space-y-6">
      {/* Wallet Hero Balance Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-400 mb-2">
              <WalletIcon className="w-4 h-4" />
              <span>Simulated Cash Wallet</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-lg font-bold text-slate-400">INR</span>
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Virtual liquidity available immediately for market execution orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenDeposit}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Deposit Funds</span>
            </button>
            <button
              onClick={onOpenWithdraw}
              disabled={walletBalance <= 0}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700/60 transition flex items-center justify-center gap-2"
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              Transaction Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditable double-entry accounting records of deposits, withdrawals, and trade debits/credits
            </p>
          </div>
          <button
            onClick={fetchTransactions}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Loading transaction ledger...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">No Transactions Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Any deposits, withdrawals, or executed trades will generate immutable ledger records here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-medium uppercase tracking-wider border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Tx ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Ledger Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {transactions.map((tx) => {
                  const type = tx.transaction_type.toLowerCase();
                  const isDeposit = type === 'deposit';
                  const isWithdraw = type === 'withdraw';
                  const isTrade = type === 'trade';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-400">
                        #{tx.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isDeposit
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isWithdraw
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {isDeposit && <ArrowDownCircle className="w-3 h-3" />}
                          {isWithdraw && <ArrowUpCircle className="w-3 h-3" />}
                          {isTrade && <ArrowRightLeft className="w-3 h-3" />}
                          {tx.transaction_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white text-sm">
                        {isDeposit ? '+' : isWithdraw ? '-' : ''}₹
                        {Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Settled
                        </span>
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
