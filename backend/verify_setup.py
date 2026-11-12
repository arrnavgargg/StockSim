import uuid
from decimal import Decimal
from sqlalchemy import text
from app.database import engine, SessionLocal, Base
from app.models import Instrument, User, Wallet
from app.services.market_data_service import MarketDataService
from fastapi.testclient import TestClient
from app.main import app


def run_checks():
    print("==================================================")
    print("🚀 StockSim Complete Backend & Trading Verification")
    print("==================================================")

    # 1. Database Connection Check
    print("\n[1/6] Checking Database connection...")
    try:
        with engine.connect() as conn:
            # Check SQLite or PostgreSQL
            dialect = engine.dialect.name
            print(f"  ✅ Connected using dialect: '{dialect}'")
    except Exception as e:
        print(f"  ❌ Database connection failed: {e}")
        return False

    # 2. Schema / Tables Verification
    print("\n[2/6] Verifying database schema...")
    try:
        # Create all tables if using SQLite or test database
        Base.metadata.create_all(bind=engine)
        print("  ✅ Schema models registered and tables verified.")
    except Exception as e:
        print(f"  ❌ Schema verification error: {e}")
        return False

    # 3. Market Instruments Seeding
    print("\n[3/6] Verifying & seeding market instruments...")
    db = SessionLocal()
    try:
        service = MarketDataService(db)
        seeded = service.seed_default_instruments()
        print(f"  ✅ Market catalog seeded with {len(seeded)} instruments (AAPL, MSFT, GOOGL, etc.)")
    finally:
        db.close()

    # 4. User Registration & Starter Wallet Auto-Provisioning
    print("\n[4/6] Verifying User Registration & $10,000 Starter Wallet...")
    client = TestClient(app)
    test_id = uuid.uuid4().hex[:6]
    username = f"trader_{test_id}"
    email = f"{username}@stocksim.test"
    password = "SecurePassword123!"

    reg_res = client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
    })
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    user_data = reg_res.json()
    assert user_data["wallet_balance"] == 10000.0, f"Expected 10000.0 wallet, got {user_data['wallet_balance']}"
    print(f"  ✅ User created: {user_data['username']} with starter balance: ${user_data['wallet_balance']:,.2f}")

    # 5. User Login & JWT Auth
    print("\n[5/6] Verifying JWT Authentication...")
    login_res = client.post("/api/auth/login", data={"username": username, "password": password})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  ✅ JWT access token issued successfully")

    # 6. Complete Trading Cycle (Buy AAPL, Verify Holding, Sell AAPL, Check Portfolio)
    print("\n[6/6] Verifying End-to-End Trading Cycle (Buy -> Portfolio -> Sell)...")

    # Buy 10 shares of AAPL
    buy_res = client.post("/api/orders", json={
        "symbol": "AAPL",
        "order_type": "buy",
        "quantity": 10,
    }, headers=headers)
    assert buy_res.status_code == 201, f"Buy order failed: {buy_res.text}"
    order_data = buy_res.json()
    print(f"  ✅ Executed BUY: {order_data['quantity']} shares of {order_data['symbol']} @ ${order_data['price']}")

    # Verify Portfolio Summary
    port_res = client.get("/api/portfolio/summary", headers=headers)
    assert port_res.status_code == 200, f"Portfolio check failed: {port_res.text}"
    port_data = port_res.json()
    print(f"  ✅ Portfolio updated: Cash=${port_data['cash_balance']:,.2f}, Stock Value=${port_data['current_portfolio_value']:,.2f}, Net Worth=${port_data['net_worth']:,.2f}")

    # Insufficient Funds Guard Check (Attempt buying 1,000,000 shares)
    fail_buy = client.post("/api/orders", json={
        "symbol": "AAPL",
        "order_type": "buy",
        "quantity": 1000000,
    }, headers=headers)
    assert fail_buy.status_code == 400, "Should have rejected order due to insufficient funds"
    print(f"  ✅ Insufficient funds guard verified: {fail_buy.json()['detail']}")

    # Sell 5 shares of AAPL
    sell_res = client.post("/api/orders", json={
        "symbol": "AAPL",
        "order_type": "sell",
        "quantity": 5,
    }, headers=headers)
    assert sell_res.status_code == 201, f"Sell order failed: {sell_res.text}"
    print("  ✅ Executed SELL: 5 shares of AAPL")

    # Final Portfolio Check
    port_res2 = client.get("/api/portfolio/summary", headers=headers)
    assert port_res2.status_code == 200
    assert len(port_res2.json()["holdings"]) == 1
    assert port_res2.json()["holdings"][0]["quantity"] == 5
    print("  ✅ Final holdings verified: 5 shares remaining")

    print("\n" + "="*50)
    print("🎉 ALL SYSTEMS OPERATIONAL: StockSim backend verified!")
    print("==================================================")
    return True


if __name__ == "__main__":
    run_checks()
