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
    print("\n[1/7] Checking Database connection...")
    try:
        with engine.connect() as conn:
            dialect = engine.dialect.name
            print(f"  ✅ Connected using dialect: '{dialect}'")
    except Exception as e:
        print(f"  ❌ Database connection failed: {e}")
        return False

    # 2. Schema / Tables Verification
    print("\n[2/7] Verifying database schema...")
    try:
        Base.metadata.create_all(bind=engine)
        print("  ✅ Schema models registered and tables verified.")
    except Exception as e:
        print(f"  ❌ Schema verification error: {e}")
        return False

    # 3. Market Instruments Seeding (Indian Blue-Chips only)
    print("\n[3/7] Verifying & seeding market instruments...")
    db = SessionLocal()
    try:
        service = MarketDataService(db)
        seeded = service.seed_default_instruments()
        symbols = [s.symbol for s in seeded]
        print(f"  ✅ Market catalog seeded with {len(seeded)} instruments ({', '.join(symbols[:4])}, ...)")

        # Verify no US stocks remain
        us_check = db.query(Instrument).filter(Instrument.symbol.in_(["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"])).all()
        if us_check:
            print(f"  ⚠️  WARNING: {len(us_check)} US stocks still in database: {[i.symbol for i in us_check]}")
        else:
            print("  ✅ No legacy US stocks in database — Indian market only.")
    finally:
        db.close()

    # 4. User Registration & ₹10,00,000 Starter Wallet Auto-Provisioning
    print("\n[4/7] Verifying User Registration & ₹10,000 Starter Wallet...")
    client = TestClient(app)
    test_id = uuid.uuid4().hex[:6]
    username = f"trader_{test_id}"
    email = f"{username}@stocksim.com"
    password = "SecurePassword123!"

    reg_res = client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
    })
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    user_data = reg_res.json()
    assert user_data["wallet_balance"] == 10000.0, f"Expected 10000.0 wallet, got {user_data['wallet_balance']}"
    print(f"  ✅ User created: {user_data['username']} with starter balance: ₹{user_data['wallet_balance']:,.2f}")

    # 5. User Login & JWT Auth
    print("\n[5/7] Verifying JWT Authentication...")
    login_res = client.post("/api/auth/login", data={"username": username, "password": password})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  ✅ JWT access token issued successfully")

    # 6. Complete Trading Cycle with Indian stock (Buy RELIANCE -> Verify -> Sell)
    print("\n[6/7] Verifying End-to-End Trading Cycle (Buy -> Portfolio -> Sell)...")

    # Buy 5 shares of RELIANCE (5 * 1363 = 6815 <= 10000 starter wallet)
    buy_res = client.post("/api/orders", json={
        "symbol": "RELIANCE",
        "order_type": "buy",
        "quantity": 5,
    }, headers=headers)
    assert buy_res.status_code == 201, f"Buy order failed: {buy_res.text}"
    order_data = buy_res.json()
    print(f"  ✅ Executed BUY: {order_data['quantity']} shares of {order_data['symbol']} @ ₹{order_data['price']}")

    # Verify Portfolio Summary
    port_res = client.get("/api/portfolio/summary", headers=headers)
    assert port_res.status_code == 200, f"Portfolio check failed: {port_res.text}"
    port_data = port_res.json()
    print(f"  ✅ Portfolio updated: Cash=₹{float(port_data['cash_balance']):,.2f}, Stock Value=₹{float(port_data['current_portfolio_value']):,.2f}, Net Worth=₹{float(port_data['net_worth']):,.2f}")

    # Insufficient Funds Guard Check
    fail_buy = client.post("/api/orders", json={
        "symbol": "RELIANCE",
        "order_type": "buy",
        "quantity": 1000000,
    }, headers=headers)
    assert fail_buy.status_code == 400, "Should have rejected order due to insufficient funds"
    print(f"  ✅ Insufficient funds guard verified: {fail_buy.json()['detail']}")

    # Sell 2 shares of RELIANCE
    sell_res = client.post("/api/orders", json={
        "symbol": "RELIANCE",
        "order_type": "sell",
        "quantity": 2,
    }, headers=headers)
    assert sell_res.status_code == 201, f"Sell order failed: {sell_res.text}"
    print("  ✅ Executed SELL: 2 shares of RELIANCE")

    # Final Portfolio Check
    port_res2 = client.get("/api/portfolio/summary", headers=headers)
    assert port_res2.status_code == 200
    assert len(port_res2.json()["holdings"]) == 1
    assert port_res2.json()["holdings"][0]["quantity"] == 3
    print("  ✅ Final holdings verified: 3 shares remaining")

    # 7. Paytm Money Market Data Ingestion Check
    print("\n[7/7] Verifying Paytm Money Open API Integration...")
    cb_res = client.get("/callback?request_token=verification_token_001")
    assert cb_res.status_code == 200, f"Callback failed: {cb_res.status_code}"
    print("  ✅ Paytm OAuth callback (/callback) exchanged token and returned redirect HTML")

    status_res = client.get("/api/paytm/status")
    assert status_res.status_code == 200
    st_json = status_res.json()
    assert st_json["authenticated"] is True
    print(f"  ✅ Paytm Money status: Authenticated, Feed: {st_json['feed']}, Valid until: {st_json['token_valid_until']}")

    rel_quote = client.get("/api/instruments/RELIANCE/quote")
    assert rel_quote.status_code == 200
    rq_json = rel_quote.json()
    assert rq_json["symbol"] == "RELIANCE"
    assert rq_json["exchange"] == "NSE"
    assert rq_json["currency"] == "INR"
    print(f"  ✅ Indian Stock Quote: {rq_json['company_name']} ({rq_json['symbol']}) ₹{float(rq_json['current_price']):,.2f} {rq_json['exchange']}")

    sync_res = client.post("/api/instruments/sync-paytm")
    assert sync_res.status_code == 200
    print(f"  ✅ Sync market data: {sync_res.json()['synced_count']} instruments updated from {sync_res.json()['source']}")

    print("\n" + "="*50)
    print("🎉 ALL SYSTEMS OPERATIONAL: StockSim backend verified!")
    print("==================================================")
    return True


if __name__ == "__main__":
    run_checks()
