# StockSim Frontend

A modern, high-performance virtual trading and portfolio management terminal built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18
- StockSim Backend API running on `http://localhost:8000`

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Visit [http://localhost:5173](http://localhost:5173). The Vite proxy forwards all `/api/*` requests directly to `http://127.0.0.1:8000`.

### 4. Build for Production
```bash
npm run build
```

---

## 🏗️ Architecture & Component Hierarchy

```
frontend/src/
├── api/
│   └── client.ts            # Typed REST API client with auto JWT bearer injection
├── components/
│   ├── AuthModal.tsx        # Registration with $10K bonus & login modal
│   ├── DepositModal.tsx     # Simulated virtual funds deposit dialog
│   ├── Navbar.tsx           # Navigation, live balance, API health status indicator
│   ├── Notification.tsx     # Animated toast alerts for trade and wallet events
│   ├── SeedBanner.tsx       # Blue-chip stock instrument catalog seeder
│   ├── StockChart.tsx       # Interactive Candlestick & Area SVG chart (1D, 1W, 1M, 1Y, ALL)
│   ├── TradingCard.tsx      # Fast BUY/SELL order ticket with validation guards
│   └── WithdrawModal.tsx    # Cash withdrawal dialog with balance checks
├── context/
│   └── AuthContext.tsx      # Global auth, JWT tokens, and wallet balance management
├── pages/
│   ├── Orders.tsx           # Order execution history ledger
│   ├── Portfolio.tsx        # Mark-to-market net worth, holdings, and P&L
│   ├── Trading.tsx          # Main market watch and trading terminal
│   └── Wallet.tsx           # Cash balance management and transaction ledger
└── types/
    └── index.ts             # TypeScript interfaces mirroring backend schemas
```

---

## ⚡ Core Features

1. **Market Watch & Live Quotes**:
   - Real-time quote cards with day high/low, previous close, and price changes.
   - Live ticker search by symbol or company name.

2. **Interactive Charting Engine**:
   - Toggle between smooth Area gradient charts and Japanese Candlestick charts.
   - Timeframe filters: 1D, 1W, 1M, 1Y, ALL.
   - Dynamic crosshair inspection with volume, open, high, low, close.

3. **Trading Terminal**:
   - Instant market order execution (`BUY` / `SELL`).
   - Insufficient funds check (validates wallet balance before buying).
   - Insufficient shares check (validates owned quantities before selling).
   - Quick quantity presets (`+1`, `+5`, `+10`, `+25`, `+50`, `MAX`).

4. **Portfolio Analytics**:
   - Live Net Worth calculation ($\text{Cash} + \sum \text{Holding Value}$).
   - Total invested cost vs current market value.
   - Unrealized Profit/Loss per position and aggregate return percentage.
   - Visual asset allocation progress bar (Cash vs. Equities).

5. **Cash Wallet & Auditable Ledger**:
   - Virtual cash top-up (`deposit`) and withdrawal (`withdraw`).
   - Immutable transaction ledger logging all trade executions and balance movements.
