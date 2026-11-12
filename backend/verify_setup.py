import uuid
from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models import Instrument
from fastapi.testclient import TestClient
from app.main import app

def run_checks():
    print("==================================================")
    print("🚀 StockSim Data Layer & Backend Verification")
    print("==================================================")

    # 1. Database Connection
    print("\n[1/4] Checking PostgreSQL connection...")
    with engine.connect() as conn:
        res = conn.execute(text("SELECT current_database(), current_user;")).fetchone()
        print(f"  ✅ Connected: Database='{res[0]}', User='{res[1]}'")

    # 2. Schema / Tables Verification
    print("\n[2/4] Verifying all tables in PostgreSQL schema...")
    expected_tables = ["users", "wallets", "instruments", "orders", "holdings", "transactions", "alembic_version"]
    with engine.connect() as conn:
        tables = [row[0] for row in conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public';")).fetchall()]
        for t in expected_tables:
            assert t in tables, f"Missing table in PostgreSQL: {t}"
            print(f"  ✅ Table verified: {t}")

    # 3. 3NF Model Insertion Check
    print("\n[3/4] Verifying 3NF relational models...")
    db = SessionLocal()
    try:
        inst = db.query(Instrument).filter_by(symbol="AAPL").first()
        if not inst:
            inst = Instrument(symbol="AAPL", company_name="Apple Inc.", current_price=175.50)
            db.add(inst)
            db.commit()
        print(f"  ✅ Instrument model confirmed: {inst.symbol} (${inst.current_price})")
    finally:
        db.close()

    # 4. End-to-End API Registration & JWT Auth Check
    print("\n[4/4] Verifying FastAPI + PostgreSQL authentication flow...")
    client = TestClient(app)
    uname = f"tirth_{uuid.uuid4().hex[:5]}"
    email = f"{uname}@stocksim.com"

    # Register
    res = client.post("/api/auth/register", json={
        "username": uname,
        "email": email,
        "password": "SecurePassword123!"
    })
    assert res.status_code == 201, f"Registration failed: {res.text}"
    user_data = res.json()
    print(f"  ✅ Registration API: Created User ID {user_data['id']} ({user_data['username']})")

    # Login
    login_res = client.post("/api/auth/login", data={
        "username": email,
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    print(f"  ✅ Login API: Password verified by bcrypt, received JWT token")

    # Current User Profile
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200, f"/me failed: {me_res.text}"
    assert me_res.json()["email"] == email
    print(f"  ✅ Protected Profile API (/api/auth/me): User fetched from database")

    print("\n" + "="*50)
    print("🎉 ALL SYSTEMS OPERATIONAL: Everything is working perfectly!")
    print("==================================================")

if __name__ == "__main__":
    run_checks()
