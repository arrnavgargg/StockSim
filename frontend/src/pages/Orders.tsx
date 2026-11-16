import React, { useState, useEffect } from 'react';
import { Order, OrderSide } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Clock, RefreshCw, Filter, ArrowDownRight, ArrowUpRight, Search, ShieldCheck } from 'lucide-react';

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all');

  const fetchOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getOrders(symbolFilter || undefined);
      setOrders(data);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, symbolFilter]);

  const filteredOrders = orders.filter((o) => {
    if (typeFilter !== 'all' && o.order_type.toLowerCase() !== typeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Order Execution History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete auditable ledger of all executed buy and sell market orders
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Symbol Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by symbol..."
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value.toUpperCase())}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono w-40"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
            {(['all', 'buy', 'sell'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg uppercase font-mono transition ${
                  typeFilter === t
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Loading order history...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">No Executed Orders</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              You haven&apos;t placed any orders yet. Trade orders will appear here immediately once executed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-medium uppercase tracking-wider border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Side</th>
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Execution Price</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredOrders.map((o) => {
                  const isBuy = o.order_type.toLowerCase() === 'buy';
                  const total = Number(o.price) * o.quantity;

                  return (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-400">
                        #{o.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(o.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isBuy
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {isBuy ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {o.order_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white text-sm">
                        {o.symbol}
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        {o.quantity} shares
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        ${Number(o.price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        ${total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 font-sans">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Executed
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
