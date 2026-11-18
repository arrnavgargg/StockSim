import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.instrument import Instrument
from app.services.market_data_service import MarketDataService


@pytest.fixture
def auth_client(client, db_session):
    # Seed default instruments (Indian blue-chips only)
    market_service = MarketDataService(db_session)
    market_service.seed_default_instruments()

    # Register user with ₹10,000 starter wallet
    uid = uuid.uuid4().hex[:6]
    username = f"trader_limit_{uid}"
    email = f"{username}@stocksim.com"
    password = "TestPassword123!"

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


def test_create_buy_limit_order_pending(auth_client):
    """ITC current price is 296.60. Target price 250.00 should stay active."""
    res = auth_client.post(
        "/api/limit-orders",
        json={
            "symbol": "ITC",
            "side": "buy",
            "quantity": 5,
            "target_price": 250.00,
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["symbol"] == "ITC"
    assert data["side"] == "buy"
    assert data["quantity"] == 5
    assert float(data["target_price"]) == 250.00
    assert data["status"] == "active"


def test_limit_order_auto_triggers_on_price_drop(auth_client, db_session):
    """Create buy limit at ₹280 for ITC. Then drop price to ₹270 -> triggers and executes!"""
    # 1. Create active buy limit order
    create_res = auth_client.post(
        "/api/limit-orders",
        json={
            "symbol": "ITC",
            "side": "buy",
            "quantity": 10,
            "target_price": 280.00,
        },
    )
    assert create_res.status_code == 201
    lo_id = create_res.json()["id"]

    # 2. Simulate price drop for ITC to 270.00
    price_res = auth_client.post(
        "/api/instruments/ITC/price",
        json={"price": 270.00},
    )
    assert price_res.status_code == 200

    # 3. Check limit order status -> should be 'triggered'
    lo_res = auth_client.get(f"/api/limit-orders/{lo_id}")
    assert lo_res.status_code == 200
    assert lo_res.json()["status"] == "triggered"
    assert lo_res.json()["executed_order_id"] is not None

    # 4. Check user holdings -> should own 10 ITC
    port_res = auth_client.get("/api/portfolio/summary")
    assert port_res.status_code == 200
    holdings = port_res.json()["holdings"]
    itc_holding = next((h for h in holdings if h["symbol"] == "ITC"), None)
    assert itc_holding is not None
    assert itc_holding["quantity"] == 10


def test_limit_order_sell_auto_triggers_on_price_rise(auth_client):
    """First buy 10 shares of ITC. Then place sell limit at ₹320. Raise price to ₹330 -> auto sells!"""
    # 1. Market buy 10 shares ITC
    buy_res = auth_client.post(
        "/api/orders",
        json={"symbol": "ITC", "order_type": "buy", "quantity": 10},
    )
    assert buy_res.status_code == 201

    # 2. Place sell limit order at ₹320
    sell_limit_res = auth_client.post(
        "/api/limit-orders",
        json={
            "symbol": "ITC",
            "side": "sell",
            "quantity": 10,
            "target_price": 320.00,
        },
    )
    assert sell_limit_res.status_code == 201
    lo_id = sell_limit_res.json()["id"]
    assert sell_limit_res.json()["status"] == "active"

    # 3. Simulate price rise to ₹330.00
    price_res = auth_client.post(
        "/api/instruments/ITC/price",
        json={"price": 330.00},
    )
    assert price_res.status_code == 200

    # 4. Limit order should now be triggered
    lo_res = auth_client.get(f"/api/limit-orders/{lo_id}")
    assert lo_res.status_code == 200
    assert lo_res.json()["status"] == "triggered"

    # 5. Holding should be 0 / liquidated
    port_res = auth_client.get("/api/portfolio/summary")
    assert port_res.status_code == 200
    holdings = port_res.json()["holdings"]
    itc_holding = next((h for h in holdings if h["symbol"] == "ITC"), None)
    assert itc_holding is None or itc_holding["quantity"] == 0


def test_cancel_limit_order(auth_client):
    """Create limit order and cancel it."""
    res = auth_client.post(
        "/api/limit-orders",
        json={
            "symbol": "SBIN",
            "side": "buy",
            "quantity": 2,
            "target_price": 750.00,
        },
    )
    assert res.status_code == 201
    lo_id = res.json()["id"]

    cancel_res = auth_client.post(f"/api/limit-orders/{lo_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"
