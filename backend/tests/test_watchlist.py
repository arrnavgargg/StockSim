import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.market_data_service import MarketDataService


@pytest.fixture
def auth_client(db_session):
    client = TestClient(app)
    market_service = MarketDataService(db_session)
    market_service.seed_default_instruments()

    uid = uuid.uuid4().hex[:6]
    username = f"trader_watch_{uid}"
    email = f"{username}@stocksim.com"
    password = "SecurePassword123!"

    reg = client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    assert reg.status_code == 201

    login = client.post(
        "/api/auth/login",
        data={"username": username, "password": password},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    client.headers = {"Authorization": f"Bearer {token}"}
    return client


def test_watchlist_add_and_list(auth_client):
    # 1. Initially watchlist is empty
    res = auth_client.get("/api/watchlist")
    assert res.status_code == 200
    assert len(res.json()) == 0

    # 2. Add AAPL and TSLA to watchlist
    add_aapl = auth_client.post("/api/watchlist/AAPL")
    assert add_aapl.status_code == 201
    assert add_aapl.json()["symbol"] == "AAPL"

    add_tsla = auth_client.post("/api/watchlist/TSLA")
    assert add_tsla.status_code == 201
    assert add_tsla.json()["symbol"] == "TSLA"

    # 3. List watchlist
    list_res = auth_client.get("/api/watchlist")
    assert list_res.status_code == 200
    symbols = [item["symbol"] for item in list_res.json()]
    assert "AAPL" in symbols
    assert "TSLA" in symbols

    # 4. Check watched symbols array
    sym_res = auth_client.get("/api/watchlist/symbols")
    assert sym_res.status_code == 200
    assert "AAPL" in sym_res.json()
    assert "TSLA" in sym_res.json()


def test_watchlist_toggle(auth_client):
    # Toggle MSFT on
    tog1 = auth_client.post("/api/watchlist/MSFT/toggle")
    assert tog1.status_code == 200
    assert tog1.json()["symbol"] == "MSFT"
    assert tog1.json()["is_watched"] is True

    # Check symbols
    sym_res = auth_client.get("/api/watchlist/symbols")
    assert "MSFT" in sym_res.json()

    # Toggle MSFT off
    tog2 = auth_client.post("/api/watchlist/MSFT/toggle")
    assert tog2.status_code == 200
    assert tog2.json()["symbol"] == "MSFT"
    assert tog2.json()["is_watched"] is False

    # Check symbols again
    sym_res2 = auth_client.get("/api/watchlist/symbols")
    assert "MSFT" not in sym_res2.json()


def test_watchlist_delete(auth_client):
    # Add NVDA
    auth_client.post("/api/watchlist/NVDA")
    syms = auth_client.get("/api/watchlist/symbols").json()
    assert "NVDA" in syms

    # Delete NVDA
    del_res = auth_client.delete("/api/watchlist/NVDA")
    assert del_res.status_code == 200
    assert del_res.json()["removed"] is True

    syms_after = auth_client.get("/api/watchlist/symbols").json()
    assert "NVDA" not in syms_after
