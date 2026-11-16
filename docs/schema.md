# StockSim Relational Database Schema & Data Contract

This document outlines the database design in **Third Normal Form (3NF)** for StockSim, detailing table structures, relationships, constraints, and data integrity rules.

---

## 1. Entity Relationship Overview

```mermaid
erDiagram
    USERS ||--|| WALLETS : owns
    USERS ||--o{ ORDERS : places
    USERS ||--o{ HOLDINGS : holds
    WALLETS ||--o{ TRANSACTIONS : logs
    INSTRUMENTS ||--o{ ORDERS : references
    INSTRUMENTS ||--o{ HOLDINGS : references

    USERS {
        int id PK
        varchar username UK
        varchar email UK
        varchar hashed_password
        timestamp created_at
    }

    WALLETS {
        int id PK
        int user_id FK,UK
        numeric balance "12,2"
        varchar currency
    }

    INSTRUMENTS {
        int id PK
        varchar symbol PK,UK
        varchar company_name
        numeric current_price "12,2"
    }

    ORDERS {
        int id PK
        int user_id FK
        varchar symbol FK
        enum order_type "buy, sell"
        int quantity
        numeric price "12,2"
        varchar status "executed, pending, cancelled"
        timestamp timestamp
    }

    HOLDINGS {
        int id PK
        int user_id FK
        varchar symbol FK
        int quantity
        numeric average_buy_price "12,2"
    }

    TRANSACTIONS {
        int id PK
        int wallet_id FK
        numeric amount "12,2"
        varchar transaction_type "deposit, withdraw, trade"
        timestamp timestamp
    }
```

---

## 2. Table Specifications

### `users`
Represents registered platform traders.
- `id` (SERIAL / INT PRIMARY KEY)
- `username` (VARCHAR(50) UNIQUE NOT NULL, INDEXED)
- `email` (VARCHAR(255) UNIQUE NOT NULL, INDEXED)
- `hashed_password` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())

### `wallets`
Virtual cash accounts holding available trading capital.
- `id` (SERIAL / INT PRIMARY KEY)
- `user_id` (INT NOT NULL UNIQUE REFERENCES `users(id)` ON DELETE CASCADE, INDEXED)
- `balance` (NUMERIC(12, 2) NOT NULL DEFAULT 10000.00)
- `currency` (VARCHAR(10) NOT NULL DEFAULT 'USD')

### `instruments`
Catalog of tradeable stock instruments and real-time market quotes.
- `id` (SERIAL / INT PRIMARY KEY)
- `symbol` (VARCHAR(10) UNIQUE NOT NULL, INDEXED)
- `company_name` (VARCHAR(200) NOT NULL)
- `current_price` (NUMERIC(12, 2) NOT NULL)

### `orders`
Log of buy and sell market orders submitted by users.
- `id` (SERIAL / INT PRIMARY KEY)
- `user_id` (INT NOT NULL REFERENCES `users(id)` ON DELETE CASCADE, INDEXED)
- `symbol` (VARCHAR(10) NOT NULL REFERENCES `instruments(symbol)`, INDEXED)
- `order_type` (ENUM('buy', 'sell') NOT NULL)
- `quantity` (INT NOT NULL CHECK (quantity > 0))
- `price` (NUMERIC(12, 2) NOT NULL)
- `status` (VARCHAR(20) NOT NULL DEFAULT 'executed')
- `timestamp` (TIMESTAMPTZ DEFAULT NOW())

### `holdings`
User stock positions currently open in their portfolio.
- `id` (SERIAL / INT PRIMARY KEY)
- `user_id` (INT NOT NULL REFERENCES `users(id)` ON DELETE CASCADE, INDEXED)
- `symbol` (VARCHAR(10) NOT NULL REFERENCES `instruments(symbol)`, INDEXED)
- `quantity` (INT NOT NULL CHECK (quantity >= 0))
- `average_buy_price` (NUMERIC(12, 2) NOT NULL)
- **Constraint**: `UNIQUE (user_id, symbol)` ensures each user has at most one holding row per ticker.

### `transactions`
Auditable double-entry transaction log for all wallet activities.
- `id` (SERIAL / INT PRIMARY KEY)
- `wallet_id` (INT NOT NULL REFERENCES `wallets(id)` ON DELETE CASCADE, INDEXED)
- `amount` (NUMERIC(12, 2) NOT NULL CHECK (amount > 0))
- `transaction_type` (VARCHAR(20) NOT NULL) — values: `'deposit'`, `'withdraw'`, `'trade'`
- `timestamp` (TIMESTAMPTZ DEFAULT NOW())

---

## 3. Financial Consistency & ACID Invariants

1. **Atomic Trade Execution**: When a `BUY` order is processed:
   - `wallets.balance` is decremented by `quantity * price`.
   - A `transactions` record is created.
   - `holdings` row is upserted with weighted average price:
     $$\text{New Avg} = \frac{(\text{Old Qty} \times \text{Old Avg}) + (\text{Bought Qty} \times \text{Price})}{\text{Old Qty} + \text{Bought Qty}}$$
   - `orders` row is created.
   - All steps commit atomically.

2. **Negative Balance Guard**: A user cannot buy stock or withdraw cash beyond their `wallets.balance`.
3. **Oversell Guard**: A user cannot sell more shares than currently recorded in `holdings.quantity`.
