# StockSim Use Cases

This document describes the primary user interactions and workflow scenarios for traders using StockSim.

---

## Use Case 1: Trader Onboarding & Registration
- **Actor**: New User
- **Goal**: Create an account and receive starter capital.
- **Preconditions**: User has valid email and password.
- **Main Flow**:
  1. User submits registration with username, email, and password.
  2. System validates that email and username are not already registered.
  3. System hashes the password with bcrypt.
  4. System creates the `User` record in PostgreSQL.
  5. System automatically provisions a `Wallet` with **$10,000 USD** virtual cash.
  6. System writes an initial `Transaction` deposit record.
  7. System returns `201 Created` with user details and starting wallet balance.

---

## Use Case 2: Stock Exploration & Market Quotes
- **Actor**: Trader (authenticated or public visitor)
- **Goal**: Find stocks and view market prices.
- **Main Flow**:
  1. User queries `/api/instruments?search=AAPL`.
  2. System returns matching instruments with company name and current price.
  3. User requests `/api/instruments/AAPL/quote`.
  4. System returns quote with previous close, intraday change, and day high/low.

---

## Use Case 3: Executing a Buy Order
- **Actor**: Authenticated Trader
- **Goal**: Purchase shares of a stock.
- **Main Flow**:
  1. User submits `POST /api/orders` with `symbol: "AAPL"`, `order_type: "buy"`, `quantity: 10`.
  2. System verifies user JWT token.
  3. System retrieves current price of AAPL ($182.50) $\rightarrow$ total required: $1,825.00.
  4. System verifies user wallet balance $\ge \$1,825.00$.
  5. System deducts $1,825.00 from user's wallet.
  6. System creates a `trade` record in `transactions`.
  7. System upserts user's holding in `holdings`, calculating the weighted average buy price.
  8. System records an `executed` order in `orders`.
  9. System returns `201 Created` with order details.
- **Alternative Flow (Insufficient Funds)**:
  - If wallet balance $< \$1,825.00$, system rejects order with HTTP 400 and `error_code: "INSUFFICIENT_FUNDS"`. No balance or holding is altered.

---

## Use Case 4: Executing a Sell Order
- **Actor**: Authenticated Trader
- **Goal**: Liquidate shares of a stock for cash.
- **Main Flow**:
  1. User submits `POST /api/orders` with `symbol: "AAPL"`, `order_type: "sell"`, `quantity: 5`.
  2. System checks `holdings` to ensure user holds $\ge 5$ shares of AAPL.
  3. System retrieves current price of AAPL ($182.50) $\rightarrow$ total revenue: $912.50.
  4. System credits $912.50 to user's wallet balance.
  5. System creates a `trade` record in `transactions`.
  6. System decrements holding quantity by 5 (if 0, deletes holding record).
  7. System records an `executed` order in `orders`.
  8. System returns `201 Created` with order details.
- **Alternative Flow (Insufficient Shares)**:
  - If user owns fewer than 5 shares, system rejects order with HTTP 400 and `error_code: "INSUFFICIENT_SHARES"`.

---

## Use Case 5: Portfolio Dashboard & Performance Tracking
- **Actor**: Authenticated Trader
- **Goal**: Monitor net worth and profit/loss.
- **Main Flow**:
  1. User calls `GET /api/portfolio/summary`.
  2. System computes:
     - Cash balance from `wallets`.
     - Current market value of all held stocks.
     - Unrealized profit/loss and return percentages.
     - Net worth = Cash + Stock Value.
  3. System returns complete dashboard data for the frontend UI.
