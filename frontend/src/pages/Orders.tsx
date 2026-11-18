import React, { useState, useEffect } from 'react';
import { LimitOrder, Order } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  ShieldCheck,
  Target,
  Zap,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'market' | 'limit'>('market');
  const [orders, setOrders] = useState<Order[]>([]);
  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) {
      setOrders([]);
      setLimitOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [marketData, limitData] = await Promise.all([
        api.getOrders(symbolFilter || undefined),
        api.getLimitOrders(),
      ]);
      setOrders(marketData);
      setLimitOrders(limitData);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 5s when viewing auto-trades to catch trigger events
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [user, symbolFilter]);

  const handleCancelLimitOrder = async (id: number) => {
    try {
      await api.cancelLimitOrder(id);
      setStatusMsg(`Auto-Trade order #${id} has been cancelled.`);
      await fetchOrders();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg(`Failed to cancel: ${err.message}`);
    }
  };

  const handleManualCheckTriggers = async () => {
    try {
      const triggered = await api.checkLimitOrderTriggers();
      if (triggered.length > 0) {
        setStatusMsg(`Checked triggers: ${triggered.length} auto-trade(s) executed!`);
      } else {
        setStatusMsg('All active auto-trades checked. No market targets reached yet.');
      }
      await fetchOrders();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg(`Trigger scan failed: ${err.message}`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (typeFilter !== 'all' && o.order_type.toLowerCase() !== typeFilter) {
      return false;
    }
    return true;
  });

  const filteredLimitOrders = limitOrders.filter((lo) => {
    if (symbolFilter && !lo.symbol.includes(symbolFilter.toUpperCase())) {
      return false;
    }
    if (typeFilter !== 'all' && lo.side.toLowerCase() !== typeFilter) {
      return false;
    }
    return true;
  });

  const activeLimitCount = limitOrders.filter((l) => l.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Toast alert if message */}
      {statusMsg && (
        <div className="p-3 bg-indigo-950/80 border border-indigo-700/60 rounded-xl text-xs text-indigo-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Header and Filter Controls */}
      <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Order Management
            </h2>
            {/* View Sub-Tabs */}
            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('market')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${
                  activeTab === 'market'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Executed Trades ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('limit')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${
                  activeTab === 'limit'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-cyan-300" />
                Auto-Trades (Limit Orders)
                {activeLimitCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-cyan-400 text-slate-950 rounded-full text-[10px] font-black">
                    {activeLimitCount} active
                  </span>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'market'
              ? 'Complete auditable ledger of all executed buy and sell market orders'
              : 'Automated price triggers: automatically buys when price drops or sells when price rises'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Symbol Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter ticker..."
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value.toUpperCase())}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono w-32"
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

          {/* Check triggers button for auto-trades */}
          {activeTab === 'limit' && (
            <button
              onClick={handleManualCheckTriggers}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition flex items-center gap-1.5"
              title="Force scan market prices for triggered orders"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Scan Triggers</span>
            </button>
          )}

          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW 1: EXECUTED MARKET ORDERS */}
      {activeTab === 'market' && (
        <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          {loading && orders.length === 0 ? (
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
                        <td className="py-3.5 px-4 text-slate-400">#{o.id}</td>
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
                          ₹{Number(o.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
      )}

      {/* VIEW 2: AUTO-TRADES (LIMIT ORDERS) */}
      {activeTab === 'limit' && (
        <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          {loading && limitOrders.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">
              Loading auto-trade orders...
            </div>
          ) : filteredLimitOrders.length === 0 ? (
            <div className="py-20 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-indigo-400" />
              </div>
              <h4 className="text-base font-bold text-white">No Auto-Trade Orders Set</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Set up automated buy and sell triggers in the Trading Terminal under &quot;Auto-Trade (Limit)&quot; to automatically execute when the market hits your target price.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 font-medium uppercase tracking-wider border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-3 px-4">Trigger ID</th>
                    <th className="py-3 px-4">Created Time</th>
                    <th className="py-3 px-4">Auto-Action</th>
                    <th className="py-3 px-4">Instrument</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Target Trigger Price</th>
                    <th className="py-3 px-4">Total Value</th>
                    <th className="py-3 px-4">Trigger Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredLimitOrders.map((lo) => {
                    const isBuy = lo.side.toLowerCase() === 'buy';
                    const targetVal = Number(lo.target_price) * lo.quantity;
                    const isActive = lo.status === 'active';
                    const isTriggered = lo.status === 'triggered';
                    const isCancelled = lo.status === 'cancelled';

                    return (
                      <tr key={lo.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 text-slate-400">#LO-{lo.id}</td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(lo.created_at).toLocaleString()}
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
                            AUTO-{lo.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white text-sm">
                          {lo.symbol}
                        </td>
                        <td className="py-3.5 px-4 text-slate-200">
                          {lo.quantity} shares
                        </td>
                        <td className="py-3.5 px-4 text-white font-bold text-sm">
                          ₹{Number(lo.target_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-[10px] text-slate-400 font-normal block">
                            {isBuy ? 'triggers on drop' : 'triggers on rise'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-200">
                          ₹{targetVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4">
                          {isActive && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                              ACTIVE (Monitoring)
                            </span>
                          )}
                          {isTriggered && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              TRIGGERED & FILLED
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400">
                              <XCircle className="w-3.5 h-3.5" />
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isActive ? (
                            <button
                              type="button"
                              onClick={() => handleCancelLimitOrder(lo.id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 transition inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Cancel
                            </button>
                          ) : isTriggered ? (
                            <span className="text-slate-500 text-[11px] font-mono">
                              Order #{lo.executed_order_id}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[11px]">---</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
