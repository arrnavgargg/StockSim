import React, { useState, useMemo } from 'react';
import { Quote } from '../types';
import { TrendingUp, TrendingDown, BarChart2, Activity } from 'lucide-react';

interface StockChartProps {
  quote: Quote | null;
  height?: number;
}

type Timeframe = '1D' | '1W' | '1M' | '1Y' | 'ALL';
type ChartStyle = 'area' | 'candle';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const StockChart: React.FC<StockChartProps> = ({ quote, height = 340 }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('area');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Generate realistic historical intraday / multiday chart points pegged to quote current_price
  const data: CandleData[] = useMemo(() => {
    if (!quote) return [];

    const basePrice = Number(quote.current_price) || 100;
    const prevClose = Number(quote.previous_close) || basePrice * 0.99;
    const dayHigh = Number(quote.day_high) || basePrice * 1.02;
    const dayLow = Number(quote.day_low) || basePrice * 0.98;

    let pointsCount = 48; // for 1D
    if (timeframe === '1W') pointsCount = 35;
    if (timeframe === '1M') pointsCount = 30;
    if (timeframe === '1Y') pointsCount = 52;
    if (timeframe === 'ALL') pointsCount = 60;

    // Deterministic pseudo-random seed based on symbol + timeframe
    let seed = quote.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const candles: CandleData[] = [];
    let currentOpen = prevClose;
    const targetEnd = basePrice;
    const totalTrend = targetEnd - prevClose;

    const times: string[] = [];
    if (timeframe === '1D') {
      const startHour = 9.5; // 9:30 AM
      const step = (16 - 9.5) / pointsCount;
      for (let i = 0; i < pointsCount; i++) {
        const h = startHour + i * step;
        const hour = Math.floor(h);
        const min = Math.floor((h - hour) * 60);
        times.push(`${hour % 12 || 12}:${min < 10 ? '0' : ''}${min} ${hour >= 12 ? 'PM' : 'AM'}`);
      }
    } else {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      for (let i = 0; i < pointsCount; i++) {
        times.push(`${days[i % 5]} ${Math.floor(i / 5) + 1}`);
      }
    }

    for (let i = 0; i < pointsCount; i++) {
      const progress = i / (pointsCount - 1);
      // Smooth path toward final price with micro volatility
      const expectedTrendPrice = prevClose + totalTrend * Math.pow(progress, 0.9);
      const noise = (random() - 0.49) * (basePrice * 0.015);
      const close = i === pointsCount - 1 ? targetEnd : Math.max(dayLow * 0.995, Math.min(dayHigh * 1.005, expectedTrendPrice + noise));
      
      const candleHigh = Math.max(currentOpen, close) + random() * (basePrice * 0.006);
      const candleLow = Math.min(currentOpen, close) - random() * (basePrice * 0.006);
      const vol = Math.floor(10000 + random() * 85000);

      candles.push({
        time: times[i],
        open: Number(currentOpen.toFixed(2)),
        high: Number(candleHigh.toFixed(2)),
        low: Number(candleLow.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: vol,
      });

      currentOpen = close;
    }

    return candles;
  }, [quote, timeframe]);

  // Calculate SVG scales
  const prices = data.flatMap((d) => [d.low, d.high]);
  const minPrice = prices.length > 0 ? Math.min(...prices) * 0.998 : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) * 1.002 : 100;
  const priceRange = maxPrice - minPrice || 1;

  const svgWidth = 800;
  const svgHeight = height - 70; // reserve space for toolbar and axis
  const paddingX = 40;
  const paddingY = 20;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingX;
    return paddingX + (index / (data.length - 1)) * (svgWidth - paddingX * 2);
  };

  const getY = (price: number) => {
    return svgHeight - paddingY - ((price - minPrice) / priceRange) * (svgHeight - paddingY * 2);
  };

  // Build SVG Path for Area Chart
  const pathD = useMemo(() => {
    if (data.length === 0) return '';
    return data.reduce((acc, point, index) => {
      const x = getX(index);
      const y = getY(point.close);
      return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [data, minPrice, maxPrice]);

  const areaD = useMemo(() => {
    if (data.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(data.length - 1);
    const bottomY = svgHeight - paddingY;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathD, data]);

  if (!quote) {
    return (
      <div
        className="w-full flex items-center justify-center bg-card rounded-xl border border-card-border"
        style={{ height }}
      >
        <div className="flex items-center gap-2 text-slate-500">
          <Activity className="w-5 h-5 animate-pulse" />
          <span>Select an instrument to view live charts</span>
        </div>
      </div>
    );
  }

  const isPositive = (Number(quote.change) || 0) >= 0;
  const strokeColor = isPositive ? '#10B981' : '#EF4444';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="w-full bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              ₹{activePoint ? activePoint.close.toFixed(2) : Number(quote.current_price).toFixed(2)}
            </span>
            <span
              className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}
              {quote.change !== undefined ? Number(quote.change).toFixed(2) : '0.00'} (
              {quote.change_percent !== undefined ? Number(quote.change_percent).toFixed(2) : '0.00'}%)
            </span>
            {quote.source === 'paytm' || quote.source === 'alpaca' ? (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Paytm Live ({quote.exchange || 'NSE'})
              </span>
            ) : (
              <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700/60 px-2 py-0.5 rounded-full font-mono">
                Simulated Feed
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3">
            <span>{activePoint ? activePoint.time : 'Market Time'}</span>
            <span>•</span>
            <span>Vol: {activePoint ? activePoint.volume.toLocaleString('en-IN') : '---'}</span>
            {hoverIndex !== null && (
              <>
                <span>•</span>
                <span>O: ₹{activePoint.open}</span>
                <span>H: ₹{activePoint.high}</span>
                <span>L: ₹{activePoint.low}</span>
              </>
            )}
          </div>
        </div>

        {/* Timeframe & Style Selectors */}
        <div className="flex items-center gap-2">
          {/* Chart style toggle */}
          <div className="bg-slate-800/70 p-1 rounded-lg flex items-center border border-slate-700/50 mr-2">
            <button
              onClick={() => setChartStyle('area')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                chartStyle === 'area'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Line Chart"
            >
              Line
            </button>
            <button
              onClick={() => setChartStyle('candle')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                chartStyle === 'candle'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Candlestick Chart"
            >
              Candles
            </button>
          </div>

          {/* Timeframe pills */}
          <div className="bg-slate-800/70 p-1 rounded-lg flex items-center border border-slate-700/50">
            {(['1D', '1W', '1M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all ${
                  timeframe === tf
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full flex-1 pt-3 select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const normX = (mouseX / rect.width) * svgWidth;
            const ratio = (normX - paddingX) / (svgWidth - paddingX * 2);
            const index = Math.round(ratio * (data.length - 1));
            if (index >= 0 && index < data.length) {
              setHoverIndex(index);
            }
          }}
        >
          <defs>
            <linearGradient id={`gradient-${quote.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines & price labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const priceVal = minPrice + (1 - pct) * priceRange;
            const y = paddingY + pct * (svgHeight - paddingY * 2);
            return (
              <g key={pct}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#1E293B"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={svgWidth - paddingX + 6}
                  y={y + 4}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ₹{priceVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Area or Candlestick rendering */}
          {chartStyle === 'area' ? (
            <>
              {/* Gradient Fill */}
              <path d={areaD} fill={`url(#gradient-${quote.symbol})`} />
              {/* Line Stroke */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            /* Candlestick bars */
            <g>
              {data.map((c, i) => {
                const x = getX(i);
                const isGreen = c.close >= c.open;
                const candleColor = isGreen ? '#10B981' : '#EF4444';
                const highY = getY(c.high);
                const lowY = getY(c.low);
                const openY = getY(c.open);
                const closeY = getY(c.close);
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(2, Math.abs(openY - closeY));
                const barWidth = Math.max(3, (svgWidth - paddingX * 2) / data.length - 3);

                return (
                  <g key={i}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={candleColor}
                      strokeWidth="1.2"
                    />
                    {/* Candle Body */}
                    <rect
                      x={x - barWidth / 2}
                      y={bodyTop}
                      width={barWidth}
                      height={bodyHeight}
                      fill={candleColor}
                      rx="1"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Hover indicator crosshair & badge */}
          {hoverIndex !== null && data[hoverIndex] && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={paddingY}
                x2={getX(hoverIndex)}
                y2={svgHeight - paddingY}
                stroke="#6366F1"
                strokeDasharray="2 2"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex].close)}
                r="5"
                fill="#6366F1"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Live pulsing dot at latest price if no hover */}
          {hoverIndex === null && data.length > 0 && (
            <g>
              <circle
                cx={getX(data.length - 1)}
                cy={getY(data[data.length - 1].close)}
                r="4"
                fill={strokeColor}
              />
              <circle
                cx={getX(data.length - 1)}
                cy={getY(data[data.length - 1].close)}
                r="9"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
                className="animate-ping"
                style={{ transformOrigin: `${getX(data.length - 1)}px ${getY(data[data.length - 1].close)}px` }}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Intraday Stat Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-2 border-t border-slate-800 text-xs">
        <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block mb-0.5">Day Range</span>
          <span className="font-mono font-medium text-slate-200">
            ₹{Number(quote.day_low || 0).toFixed(2)} - ₹{Number(quote.day_high || 0).toFixed(2)}
          </span>
        </div>
        <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block mb-0.5">Prev Close</span>
          <span className="font-mono font-medium text-slate-200">
            ₹{Number(quote.previous_close || 0).toFixed(2)}
          </span>
        </div>
        <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block mb-0.5">Day High</span>
          <span className="font-mono font-medium text-emerald-400">
            ₹{Number(quote.day_high || 0).toFixed(2)}
          </span>
        </div>
        <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 block mb-0.5">Day Low</span>
          <span className="font-mono font-medium text-red-400">
            ₹{Number(quote.day_low || 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
