import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.services.market_data_service import MarketDataService

# In-memory SQLite database isolated for lightning fast tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh tables for every test function and tear down after."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed default instruments
    market_service = MarketDataService(db)
    market_service.seed_default_instruments()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def auth_headers(client):
    """Helper fixture providing an authenticated user's Authorization Bearer header."""
    user_payload = {
        "username": "testtrader",
        "email": "testtrader@stocksim.com",
        "password": "Password123!",
    }
    client.post("/api/auth/register", json=user_payload)
    login_res = client.post("/api/auth/login", data={"username": "testtrader", "password": "Password123!"})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
