import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.market_data_service import MarketDataService


@pytest.fixture
def auth_client(client, db_session):
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

    # 2. Add RELIANCE and TCS to watchlist
    add_rel = auth_client.post("/api/watchlist/RELIANCE")
    assert add_rel.status_code == 201
    assert add_rel.json()["symbol"] == "RELIANCE"

    add_tcs = auth_client.post("/api/watchlist/TCS")
    assert add_tcs.status_code == 201
    assert add_tcs.json()["symbol"] == "TCS"

    # 3. List watchlist
    list_res = auth_client.get("/api/watchlist")
    assert list_res.status_code == 200
    symbols = [item["symbol"] for item in list_res.json()]
    assert "RELIANCE" in symbols
    assert "TCS" in symbols

    # 4. Check watched symbols array
    sym_res = auth_client.get("/api/watchlist/symbols")
    assert sym_res.status_code == 200
    assert "RELIANCE" in sym_res.json()
    assert "TCS" in sym_res.json()


def test_watchlist_toggle(auth_client):
    # Toggle INFY on
    tog1 = auth_client.post("/api/watchlist/INFY/toggle")
    assert tog1.status_code == 200
    assert tog1.json()["symbol"] == "INFY"
    assert tog1.json()["is_watched"] is True

    # Check symbols
    sym_res = auth_client.get("/api/watchlist/symbols")
    assert "INFY" in sym_res.json()

    # Toggle INFY off
    tog2 = auth_client.post("/api/watchlist/INFY/toggle")
    assert tog2.status_code == 200
    assert tog2.json()["symbol"] == "INFY"
    assert tog2.json()["is_watched"] is False

    # Check symbols again
    sym_res2 = auth_client.get("/api/watchlist/symbols")
    assert "INFY" not in sym_res2.json()


def test_watchlist_delete(auth_client):
    # Add SBIN
    auth_client.post("/api/watchlist/SBIN")
    syms = auth_client.get("/api/watchlist/symbols").json()
    assert "SBIN" in syms

    # Delete SBIN
    del_res = auth_client.delete("/api/watchlist/SBIN")
    assert del_res.status_code == 200
    assert del_res.json()["removed"] is True

    syms_after = auth_client.get("/api/watchlist/symbols").json()
    assert "SBIN" not in syms_after
