# StockSim

A Modern Virtual Stock Trading and Portfolio Management Platform.

---

## 👥 Team Responsibilities & Workflow

| Role | Focus Area | Key Contacts / Folders |
| :--- | :--- | :--- |
| **Backend** | Business Logic, Order Matching, API Design, Auth, Ledger | `backend/app/`, `backend/tests/` |
| **Frontend** | React / Vite Dashboard, Stock Charts, Trading Terminal | `frontend/` |
| **Database** | PostgreSQL, 3NF Relational Modeling, Alembic Migrations | `backend/alembic/`, `backend/app/models/` |

---

## 🚀 Quickstart: Backend

### 1. Setup Virtual Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```
Configure your PostgreSQL `DATABASE_URL` (or leave default for local testing).

### 3. Run Database Migrations (or Seeding)
```bash
# If using PostgreSQL with Alembic:
alembic upgrade head

# Seed default blue-chip market stocks:
curl -X POST http://localhost:8000/api/instruments/seed
```

### 4. Run the Backend API Server
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Interactive ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 5. Run Verification & Automated Tests
```bash
# Complete end-to-end smoke test:
python verify_setup.py

# Run pytest unit & integration tests:
pytest tests/ -v
```

---

## 🎨 Quickstart: Frontend

The StockSim frontend is built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**, featuring high-performance financial charts and a dark-theme trading desk interface.

### 1. Install Node Dependencies
```bash
cd frontend
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The Vite development server automatically proxies `/api` requests to `http://localhost:8000`.

### 3. Production Build
```bash
npm run build
```

---

## 🖥️ Frontend Features

- **Trading Terminal (`/`)**:
  - Live watchlist of tradeable blue chips with real-time search and filter.
  - Interactive SVG price charts with **Area** and **Candlestick** modes across **1D**, **1W**, **1M**, **1Y**, and **ALL** timeframes with crosshair hover tooltips.
  - Market Order Ticket supporting atomic `BUY` and `SELL` orders, quick quantity adjustments, max-afford calculation, and real-time cash/shares validation.
- **Portfolio Dashboard**:
  - Real-time mark-to-market net worth, total invested capital, current equity valuation, and unrealized profit/loss ($ and %).
  - Visual asset allocation progress breakdown (Cash vs. Equities).
  - Active positions table with average cost basis, current market prices, live returns, and direct trade shortcuts.
- **Order Execution History**:
  - Chronological transaction log of all executed trades with side filters (`BUY`, `SELL`, `ALL`) and symbol search.
- **Wallet & Cash Ledger**:
  - Available cash balance display with quick virtual deposit and withdrawal modals.
  - Auditable transaction ledger tracking deposits, withdrawals, and trade debits/credits.
- **Authentication & Starter Capital**:
  - OAuth2 JWT Bearer token authentication with instant **$10,000 USD** starter wallet auto-provisioned upon registration.
  - One-click **Demo Trader** shortcut for instant trial and presentation.

---

## 📡 Core API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - Create account (auto-provisions **$10,000 USD** starter wallet)
- `POST /api/auth/login` - OAuth2 login returning JWT Bearer token
- `GET /api/auth/me` - Profile & active balance

### 📈 Market Data & Instruments (`/api/instruments`)
- `GET /api/instruments` - List & search stocks
- `GET /api/instruments/{symbol}` - Instrument details
- `GET /api/instruments/{symbol}/quote` - Real-time quotes and intraday stats
- `POST /api/instruments/seed` - Seed stock catalog (AAPL, MSFT, GOOGL, TSLA, NVDA, etc.)

### 💼 Trading & Orders (`/api/orders`)
- `POST /api/orders` - Execute BUY or SELL market order (atomic execution)
- `GET /api/orders` - User order history
- `GET /api/orders/{id}` - Specific order details

### 📊 Portfolio & Performance (`/api/portfolio`)
- `GET /api/portfolio/summary` - Net worth, cash, invested value, total unrealized P&L
- `GET /api/portfolio/holdings` - Active positions with cost basis and live P&L

### 💳 Wallet & Ledger (`/api/wallet`)
- `GET /api/wallet/me` - Current cash balance
- `POST /api/wallet/deposit` - Deposit virtual funds
- `POST /api/wallet/withdraw` - Withdraw funds
- `GET /api/wallet/transactions` - Auditable transaction ledger

---

## 📚 Documentation
- [docs/schema.md](file:///home/satoru/StockSim/docs/schema.md) — 3NF Relational Database Schema & Invariants
- [docs/SRS.md](file:///home/satoru/StockSim/docs/SRS.md) — Software Requirements Specification
- [docs/usecase.md](file:///home/satoru/StockSim/docs/usecase.md) — Platform Use Cases & Workflows
