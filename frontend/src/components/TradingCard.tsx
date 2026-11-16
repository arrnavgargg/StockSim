import React, { useState } from 'react';
import { Instrument, OrderSide, PortfolioHoldingItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, AlertTriangle, Wallet as WalletIcon, ShieldAlert } from 'lucide-react';

interface TradingCardProps {
  instrument: Instrument | null;
  userHolding?: PortfolioHoldingItem;
  onOrderSuccess: (msg: string) => void;
}

export const TradingCard: React.FC<TradingCardProps> = ({
  instrument,
  userHolding,
  onOrderSuccess,
}) => {
  const { user, walletBalance, refreshUser, setShowAuthModal, setAuthMode } = useAuth();
  const [orderType, setOrderType] = useState<OrderSide>('buy');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!instrument) {
    return (
      <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex items-center justify-center text-slate-500">
        Select a stock to trade
      </div>
    );
  }

  const price = Number(instrument.current_price) || 0;
  const totalEstimatedCost = quantity * price;
  const ownedQuantity = userHolding ? userHolding.quantity : 0;

  // Max calculations
  const maxBuyQuantity = price > 0 ? Math.floor(walletBalance / price) : 0;
  const maxSellQuantity = ownedQuantity;

  const handleQuickQty = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleSetMax = () => {
    if (orderType === 'buy') {
      setQuantity(Math.max(1, maxBuyQuantity));
    } else {
      setQuantity(Math.max(1, maxSellQuantity));
    }
  };

  const isBuy = orderType === 'buy';
  const hasInsufficientFunds = isBuy && totalEstimatedCost > walletBalance;
  const hasInsufficientShares = !isBuy && quantity > ownedQuantity;

  const handleExecuteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('Quantity must be at least 1 share.');
      return;
    }

    if (hasInsufficientFunds) {
      setErrorMsg(`Insufficient funds: Need $${totalEstimatedCost.toFixed(2)}, have $${walletBalance.toFixed(2)}.`);
      return;
    }

    if (hasInsufficientShares) {
      setErrorMsg(`Insufficient shares: You own ${ownedQuantity} shares of ${instrument.symbol}.`);
      return;
    }

    try {
      setLoading(true);
      const order = await api.placeOrder(instrument.symbol, orderType, quantity);
      await refreshUser();
      onOrderSuccess(
        `Successfully executed ${order.order_type.toUpperCase()} order for ${order.quantity} shares of ${order.symbol} @ $${Number(order.price).toFixed(2)}!`
      );
      setQuantity(1);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header Title & Ticker Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Order Ticket
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">
                MARKET
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{instrument.symbol} • {instrument.company_name}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Market Price</span>
            <span className="text-lg font-extrabold text-white font-mono">
              ${price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Order Side Tabs (BUY / SELL) */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setOrderType('buy');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isBuy
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            BUY {instrument.symbol}
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderType('sell');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              !isBuy
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            SELL {instrument.symbol}
          </button>
        </div>

        {/* Available Balance / Holding Information */}
        <div className="mt-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <WalletIcon className="w-3.5 h-3.5 text-indigo-400" />
            {isBuy ? 'Available Cash' : 'Owned Position'}
          </span>
          <span className="font-mono font-semibold text-slate-200">
            {isBuy ? `$${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${ownedQuantity} shares`}
          </span>
        </div>

        {/* Quantity Controls */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <label htmlFor="quantity-input" className="font-medium">Number of Shares</label>
            <span className="font-mono">
              {isBuy ? `Max buy: ${maxBuyQuantity}` : `Max sell: ${maxSellQuantity}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickQty(-1)}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold transition flex items-center justify-center"
            >
              -
            </button>
            <input
              id="quantity-input"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-center font-mono text-lg font-bold text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => handleQuickQty(1)}
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center justify-center"
            >
              +
            </button>
          </div>

          {/* Quick Quantity Shortcuts */}
          <div className="flex items-center gap-1.5 mt-2">
            {[1, 5, 10, 25, 50].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuantity(q)}
                className="flex-1 py-1 text-xs font-mono font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded transition"
              >
                +{q}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSetMax}
              disabled={isBuy ? maxBuyQuantity <= 0 : maxSellQuantity <= 0}
              className="flex-1 py-1 text-xs font-mono font-semibold bg-indigo-900/40 hover:bg-indigo-800/60 disabled:opacity-30 text-indigo-300 border border-indigo-700/50 rounded transition"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="mt-5 space-y-2 pt-4 border-t border-slate-800/80 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Execution Type</span>
            <span className="font-mono text-slate-200">Instant Market Execution</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Execution Price</span>
            <span className="font-mono text-slate-200">${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Trading Commission</span>
            <span className="font-mono text-emerald-400 font-semibold">$0.00 (Zero Fee)</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-white pt-2 border-t border-slate-800">
            <span>Estimated Total</span>
            <span className="font-mono text-base font-bold text-white">
              ${totalEstimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Warning or Error Messages */}
        {hasInsufficientFunds && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Insufficient Cash Balance</p>
              <p className="text-red-400/80 mt-0.5">
                You need ${(totalEstimatedCost - walletBalance).toFixed(2)} more. Deposit virtual funds in the Wallet tab.
              </p>
            </div>
          </div>
        )}

        {hasInsufficientShares && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Insufficient Shares</p>
              <p className="text-red-400/80 mt-0.5">
                You only own {ownedQuantity} shares of {instrument.symbol}.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800 rounded-xl flex items-start gap-2 text-xs text-red-200">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Submit / Trigger Button */}
      <div className="mt-6">
        {user ? (
          <button
            type="button"
            onClick={handleExecuteOrder}
            disabled={loading || (isBuy ? hasInsufficientFunds : hasInsufficientShares)}
            className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide uppercase shadow-lg transition-all flex items-center justify-center gap-2 ${
              isBuy
                ? 'bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white shadow-emerald-950/60'
                : 'bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white shadow-red-950/60'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Executing Order...
              </span>
            ) : (
              <span>
                Confirm {orderType.toUpperCase()} {quantity} Shares of {instrument.symbol}
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
            className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-950/50 transition flex items-center justify-center gap-2"
          >
            Sign In to Trade
          </button>
        )}
      </div>
    </div>
  );
};
