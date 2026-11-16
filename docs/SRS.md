# Software Requirements Specification (SRS)

## StockSim: Virtual Stock Trading and Portfolio Management System

---

## 1. Introduction

### 1.1 Purpose
StockSim is a web-based simulated stock market platform that empowers users to practice trading real-world equities in a risk-free environment. It provides live simulated market quotes, portfolio tracking, real-time performance analytics, and order execution.

### 1.2 Team Ownership & Responsibilities
- **Backend Engineer**: API design, business logic, order execution engine, auth, financial ledger, and unit/integration testing.
- **Frontend Engineer**: User interface, trading terminal, charts (TradingView/Recharts), portfolio dashboard, and state management.
- **Database Engineer**: Relational data modeling (3NF), PostgreSQL hosting/setup, Alembic migrations, and database optimization.

---

## 2. Functional Requirements

### 2.1 User Authentication & Profile
- **FR-1.1**: Users can register with username, email, and password.
- **FR-1.2**: Upon registration, an initial virtual cash wallet of **$10,000 USD** is automatically provisioned.
- **FR-1.3**: Users log in using OAuth2 Bearer JWT tokens.
- **FR-1.4**: Protected `/api/auth/me` endpoint returns active user credentials and wallet balance.

### 2.2 Market Data & Instruments
- **FR-2.1**: Browse list of tradeable instruments with search by ticker or company name (`GET /api/instruments`).
- **FR-2.2**: Fetch real-time market quote including 24-hour change, percentage change, day high, and day low (`GET /api/instruments/{symbol}/quote`).
- **FR-2.3**: Seed catalog with standard blue-chip equities (AAPL, MSFT, GOOGL, TSLA, NVDA, META, etc.).

### 2.3 Trading & Order Execution
- **FR-3.1**: Place market `BUY` orders with positive integer share quantities.
- **FR-3.2**: Place market `SELL` orders with positive integer share quantities.
- **FR-3.3**: Validate cash balance before buying (reject with `INSUFFICIENT_FUNDS` error).
- **FR-3.4**: Validate owned share quantity before selling (reject with `INSUFFICIENT_SHARES` error).
- **FR-3.5**: Atomically execute trade, update cash wallet, update holding position, record transaction, and persist order in a single transaction.
- **FR-3.6**: Retrieve paginated order history (`GET /api/orders`).

### 2.4 Portfolio Analytics
- **FR-4.1**: Compute live Net Worth: $\text{Cash Balance} + \sum (\text{Holding Quantity} \times \text{Current Price})$.
- **FR-4.2**: Compute Unrealized Profit/Loss per holding: $(\text{Current Price} - \text{Average Buy Price}) \times \text{Quantity}$.
- **FR-4.3**: Compute Unrealized Profit/Loss percentage: $\frac{\text{Current Value} - \text{Total Invested}}{\text{Total Invested}} \times 100\%$.
- **FR-4.4**: Provide consolidated dashboard endpoint (`GET /api/portfolio/summary`).

### 2.5 Cash Wallet & Ledger
- **FR-5.1**: View active wallet balance (`GET /api/wallet/me`).
- **FR-5.2**: Deposit virtual cash into wallet (`POST /api/wallet/deposit`).
- **FR-5.3**: Withdraw cash with balance check (`POST /api/wallet/withdraw`).
- **FR-5.4**: View transaction history ledger (`GET /api/wallet/transactions`).

---

## 3. API Route Specifications

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user + provision $10,000 wallet | No |
| `POST` | `/api/auth/login` | Login and retrieve JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/wallet/me` | Get wallet cash balance | Yes |
| `POST` | `/api/wallet/deposit` | Deposit virtual funds | Yes |
| `POST` | `/api/wallet/withdraw` | Withdraw virtual funds | Yes |
| `GET` | `/api/wallet/transactions` | Transaction ledger history | Yes |
| `GET` | `/api/instruments` | Search & list stock instruments | No |
| `GET` | `/api/instruments/{symbol}` | Get instrument details | No |
| `GET` | `/api/instruments/{symbol}/quote` | Get real-time stock quote & intraday stats | No |
| `POST` | `/api/instruments/seed` | Seed default blue-chip instruments | No |
| `POST` | `/api/orders` | Place BUY or SELL market order | Yes |
| `GET` | `/api/orders` | Order execution history | Yes |
| `GET` | `/api/orders/{id}` | Specific order details | Yes |
| `GET` | `/api/portfolio/summary` | Consolidated portfolio metrics & P&L | Yes |
| `GET` | `/api/portfolio/holdings` | List of active stock positions | Yes |
| `GET` | `/api/health` | Health check endpoint | No |
