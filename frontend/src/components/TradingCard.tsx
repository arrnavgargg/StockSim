import React, { useState, useEffect } from 'react';
import { Instrument, OrderSide, PortfolioHoldingItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Wallet as WalletIcon,
  ShieldAlert,
  Zap,
  Target,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface TradingCardProps {
  instrument: Instrument | null;
  userHolding?: PortfolioHoldingItem;
  onOrderSuccess: (msg: string) => void;
  onPriceSimulated?: () => void;
}

export const TradingCard: React.FC<TradingCardProps> = ({
  instrument,
  userHolding,
  onOrderSuccess,
  onPriceSimulated,
}) => {
  const { user, walletBalance, refreshUser, setShowAuthModal, setAuthMode } = useAuth();
  const [executionMode, setExecutionMode] = useState<'market' | 'limit'>('market');
  const [orderType, setOrderType] = useState<OrderSide>('buy');
  const [quantity, setQuantity] = useState<number>(1);
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [simPrice, setSimPrice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSimulateBox, setShowSimulateBox] = useState<boolean>(false);

  const price = instrument ? Number(instrument.current_price) || 0 : 0;

  // Initialize target price when instrument or orderType changes
  useEffect(() => {
    if (price > 0) {
      if (orderType === 'buy') {
        setTargetPrice(Number((price * 0.95).toFixed(2))); // 5% discount
      } else {
        setTargetPrice(Number((price * 1.05).toFixed(2))); // 5% profit target
      }
      setSimPrice(price.toFixed(2));
    }
  }, [price, orderType, instrument?.symbol]);

  if (!instrument) {
    return (
      <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex items-center justify-center text-slate-500">
        Select a stock to trade
      </div>
    );
  }

  const isBuy = orderType === 'buy';
  const effectivePrice = executionMode === 'market' ? price : targetPrice;
  const totalEstimatedCost = quantity * effectivePrice;
  const ownedQuantity = userHolding ? userHolding.quantity : 0;

  // Max calculations
  const maxBuyQuantity = effectivePrice > 0 ? Math.floor(walletBalance / effectivePrice) : 0;
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

  const handleQuickTarget = (percentDelta: number) => {
    const calculated = price * (1 + percentDelta / 100);
    setTargetPrice(Number(Math.max(0.01, calculated).toFixed(2)));
  };

  const hasInsufficientFunds = isBuy && totalEstimatedCost > walletBalance;
  const hasInsufficientShares = !isBuy && quantity > ownedQuantity;

  const priceDiffPct =
    price > 0 ? (((targetPrice - price) / price) * 100).toFixed(1) : '0.0';

  const handleExecute = async (e: React.FormEvent) => {
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

    if (executionMode === 'limit' && targetPrice <= 0) {
      setErrorMsg('Target price must be greater than $0.');
      return;
    }

    if (hasInsufficientFunds) {
      setErrorMsg(
        `Insufficient funds: Need $${totalEstimatedCost.toFixed(2)}, have $${walletBalance.toFixed(2)}.`
      );
      return;
    }

    if (hasInsufficientShares) {
      setErrorMsg(`Insufficient shares: You own ${ownedQuantity} shares of ${instrument.symbol}.`);
      return;
    }

    try {
      setLoading(true);

      if (executionMode === 'market') {
        const order = await api.placeOrder(instrument.symbol, orderType, quantity);
        await refreshUser();
        onOrderSuccess(
          `Executed ${order.order_type.toUpperCase()} ${order.quantity} shares of ${order.symbol} @ $${Number(order.price).toFixed(2)}!`
        );
      } else {
        // Limit / Auto-Trade order
        const limitOrder = await api.createLimitOrder(
          instrument.symbol,
          orderType,
          quantity,
          targetPrice
        );
        await refreshUser();

        if (limitOrder.status === 'triggered') {
          onOrderSuccess(
            `Auto-Trade condition already met! Immediately executed ${limitOrder.side.toUpperCase()} ${limitOrder.quantity} ${limitOrder.symbol} @ $${price.toFixed(2)}!`
          );
        } else {
          onOrderSuccess(
            `Auto-Trade active! System will auto-${limitOrder.side.toUpperCase()} ${limitOrder.quantity} ${limitOrder.symbol} once price reaches $${Number(limitOrder.target_price).toFixed(2)}.`
          );
        }
      }
      setQuantity(1);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process order.');
    } finally {
      setLoading(false);
    }
  };

  // Simulate market price move (for testing / demoing auto-trades)
  const handleSimulatePrice = async () => {
    const p = parseFloat(simPrice);
    if (isNaN(p) || p <= 0) return;
    try {
      setLoading(true);
      await api.updateInstrumentPrice(instrument.symbol, p);
      onOrderSuccess(`Market price for ${instrument.symbol} moved to $${p.toFixed(2)}! Checking auto-trade triggers...`);
      if (onPriceSimulated) onPriceSimulated();
      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update price');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header Title & Execution Mode Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Order Ticket
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {instrument.symbol} • {instrument.company_name}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
              Live Market
            </span>
            <span className="text-lg font-extrabold text-white font-mono">
              ${price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Execution Mode Selector: Instant Market vs Auto-Trade Limit */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setExecutionMode('market');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              executionMode === 'market'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Market (Instant)
          </button>
          <button
            type="button"
            onClick={() => {
              setExecutionMode('limit');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              executionMode === 'limit'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-cyan-300" />
            Auto-Trade (Limit)
          </button>
        </div>

        {/* Order Side Tabs (BUY / SELL) */}
        <div className="grid grid-cols-2 gap-2 mt-3 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setOrderType('buy');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
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
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
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
        <div className="mt-3 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <WalletIcon className="w-3.5 h-3.5 text-indigo-400" />
            {isBuy ? 'Available Cash' : 'Owned Position'}
          </span>
          <span className="font-mono font-semibold text-slate-200">
            {isBuy
              ? `$${walletBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : `${ownedQuantity} shares`}
          </span>
        </div>

        {/* AUTO-TRADE LIMIT PRICE CONTROLS */}
        {executionMode === 'limit' && (
          <div className="mt-4 p-3 bg-indigo-950/30 rounded-xl border border-indigo-800/50 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="target-price-input" className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                Auto-{isBuy ? 'Buy' : 'Sell'} Target Price (USD)
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {Number(priceDiffPct) >= 0 ? `+${priceDiffPct}%` : `${priceDiffPct}%`} vs market
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 font-mono font-bold text-sm">
                $
              </span>
              <input
                id="target-price-input"
                type="number"
                step="0.01"
                min="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-indigo-700/60 rounded-lg pl-8 pr-3 py-2 font-mono text-base font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Quick target price chips */}
            <div className="flex items-center gap-1.5">
              {isBuy ? (
                <>
                  {[-2, -5, -10, -20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleQuickTarget(pct)}
                      className="flex-1 py-1 text-[11px] font-mono font-semibold bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 rounded border border-indigo-700/40 transition"
                    >
                      {pct}%
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[+2, +5, +10, +20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleQuickTarget(pct)}
                      className="flex-1 py-1 text-[11px] font-mono font-semibold bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 rounded border border-emerald-700/40 transition"
                    >
                      +{pct}%
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Condition Explainer Badge */}
            <p className="text-[11px] text-indigo-300/90 leading-tight">
              {isBuy ? (
                <span>
                  📉 Order automatically executes when market drops to <strong>${targetPrice.toFixed(2)}</strong> or lower.
                </span>
              ) : (
                <span>
                  📈 Order automatically executes when market rises to <strong>${targetPrice.toFixed(2)}</strong> or higher.
                </span>
              )}
            </p>
          </div>
        )}

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
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold transition flex items-center justify-center text-sm"
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
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-center font-mono text-base font-bold text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => handleQuickQty(1)}
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center justify-center text-sm"
            >
              +
            </button>
          </div>

          {/* Quick Quantity Shortcuts */}
          <div className="flex items-center gap-1 mt-2">
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
        <div className="mt-4 space-y-1.5 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Execution Type</span>
            <span className="font-mono text-slate-200">
              {executionMode === 'market' ? 'Instant Market Fill' : 'Auto-Trade on Price Target'}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>{executionMode === 'market' ? 'Execution Price' : 'Target Trigger Price'}</span>
            <span className="font-mono text-slate-200">${effectivePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-white pt-2 border-t border-slate-800">
            <span>Estimated Total</span>
            <span className="font-mono text-base font-bold text-white">
              ${totalEstimatedCost.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Insufficient warnings */}
        {hasInsufficientFunds && (
          <div className="mt-3 p-2.5 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Insufficient Cash Balance</p>
              <p className="text-red-400/80 mt-0.5">
                Need ${(totalEstimatedCost - walletBalance).toFixed(2)} more cash.
              </p>
            </div>
          </div>
        )}

        {hasInsufficientShares && (
          <div className="mt-3 p-2.5 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="font-semibold">
              You only hold {ownedQuantity} shares of {instrument.symbol}.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 p-2.5 bg-red-950/50 border border-red-800 rounded-xl flex items-start gap-2 text-xs text-red-200">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Submit / Trigger Button */}
      <div className="mt-5 space-y-3">
        {user ? (
          <button
            type="button"
            onClick={handleExecute}
            disabled={loading || (isBuy ? hasInsufficientFunds : hasInsufficientShares)}
            className={`w-full py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase shadow-lg transition-all flex items-center justify-center gap-2 ${
              executionMode === 'limit'
                ? 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-indigo-950/60'
                : isBuy
                ? 'bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white shadow-emerald-950/60'
                : 'bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white shadow-red-950/60'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : executionMode === 'limit' ? (
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                Set Auto-{orderType.toUpperCase()} {quantity} {instrument.symbol} @ ${targetPrice.toFixed(2)}
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
            className="w-full py-3.5 rounded-xl text-xs font-bold tracking-wide bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-950/50 transition flex items-center justify-center gap-2"
          >
            Sign In to Trade
          </button>
        )}

        {/* Simulate Price Movement Drawer (Useful for testing / live demonstrations) */}
        <div className="pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => setShowSimulateBox(!showSimulateBox)}
            className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition mx-auto"
          >
            <Sliders className="w-3 h-3" />
            <span>{showSimulateBox ? 'Hide Price Simulator' : '⚡ Simulate Price Movement to Test Auto-Triggers'}</span>
          </button>

          {showSimulateBox && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                Set Simulated Market Price for {instrument.symbol}
              </span>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={simPrice}
                    onChange={(e) => setSimPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Enter price (e.g. 50.00)"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSimulatePrice}
                  disabled={loading}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Move Price
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Instantly shifts the market price of {instrument.symbol} and auto-executes any triggered limit orders.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
