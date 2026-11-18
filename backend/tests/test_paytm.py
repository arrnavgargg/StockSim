"""Tests for Paytm Money Open API integration:
- Token store & IST expiration logic
- 23-byte binary LTP packet parser & JSON tick parser
- Historical bars standardizing OHLCV
- REST endpoints (/callback, /api/paytm/*, /api/instruments/*)
- WebSocket client background lifecycle
"""
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import json
import struct
import pytest

from app.schemas.paytm import PaytmStatusResponse, PaytmSyncResponse
from app.services.paytm_service import INDIAN_EQUITIES, paytm_service
from app.services.paytm_token_store import PaytmTokenStore, token_store
from app.services.paytm_websocket_client import paytm_ws_client


def test_paytm_token_store_lifecycle(tmp_path):
    """Test token store setting, expiration, persistence, and clearance."""
    custom_store = PaytmTokenStore(session_file=str(tmp_path / ".test_session.json"))
    assert not custom_store.is_authenticated()

    # Set mock tokens
    custom_store.set_tokens(
        access_token="test_access_token_12345",
        public_access_token="test_public_token_67890",
        read_access_token="test_read_token",
        merchant_id="MER_TEST_1",
    )
    assert custom_store.is_authenticated()
    assert custom_store.get_access_token() == "test_access_token_12345"
    assert custom_store.get_public_access_token() == "test_public_token_67890"

    info = custom_store.get_session_info()
    assert info["is_valid"] is True
    assert info["merchant_id"] == "MER_TEST_1"
    assert "IST" in info["valid_until"]

    # Test clearing token store
    custom_store.clear()
    assert not custom_store.is_authenticated()
    assert custom_store.get_access_token() is None


def test_paytm_binary_tick_parser_23_byte_ltp():
    """Test parsing 23-byte binary LTP packets from Paytm Money Live Broadcast."""
    # RELIANCE security_id is 2885
    sec_id = 2885
    packet_code = 1
    last_price = 2980.50
    last_traded_time = 1716300000
    tradable = 1
    mode = 1
    change_abs = 25.50
    change_pct = 0.86

    # Pack into 23 bytes: <BfIIBBff
    packet_bytes = struct.pack(
        "<BfIIBBff",
        packet_code,
        last_price,
        last_traded_time,
        sec_id,
        tradable,
        mode,
        change_abs,
        change_pct,
    )
    assert len(packet_bytes) == 23

    ticks = paytm_service.parse_tick_packet(packet_bytes)
    assert len(ticks) == 1
    tick = ticks[0]
    assert tick["symbol"] == "RELIANCE"
    assert tick["security_id"] == 2885
    assert tick["last_price"] == Decimal("2980.50")
    assert tick["change"] == Decimal("25.50")
    assert tick["change_percent"] == Decimal("0.86")
    assert tick["exchange"] == "NSE"


def test_paytm_binary_multi_packet_parser():
    """Test parsing multiple consecutive 23-byte LTP packets in a single payload."""
    # Packet 1: TCS (security_id: 11536)
    p1 = struct.pack("<BfIIBBff", 1, 4180.00, 1716300001, 11536, 1, 1, 30.0, 0.72)
    # Packet 2: INFY (security_id: 1594)
    p2 = struct.pack("<BfIIBBff", 1, 1850.25, 1716300002, 1594, 1, 1, -12.5, -0.67)

    payload = p1 + p2
    assert len(payload) == 46

    ticks = paytm_service.parse_tick_packet(payload)
    assert len(ticks) == 2
    assert ticks[0]["symbol"] == "TCS"
    assert ticks[0]["last_price"] == Decimal("4180.00")
    assert ticks[1]["symbol"] == "INFY"
    assert ticks[1]["last_price"] == Decimal("1850.25")


def test_paytm_json_tick_parser():
    """Test parsing JSON tick packets."""
    json_data = json.dumps([
        {
            "security_id": 1333,
            "last_price": 1690.80,
            "change": 8.20,
            "change_percent": 0.49,
            "volume": 2400000,
        }
    ])
    ticks = paytm_service.parse_tick_packet(json_data)
    assert len(ticks) == 1
    assert ticks[0]["symbol"] == "HDFCBANK"
    assert ticks[0]["last_price"] == Decimal("1690.80")
    assert ticks[0]["volume"] == 2400000


def test_paytm_historical_bars_generation():
    """Test generating standard OHLCV historical bars."""
    bars = paytm_service.get_historical_bars("RELIANCE", limit=15)
    assert len(bars) > 0
    bar = bars[0]
    assert "t" in bar
    assert "o" in bar
    assert "h" in bar
    assert "l" in bar
    assert "c" in bar
    assert "v" in bar
    assert bar["h"] >= bar["l"]
    assert bar["v"] > 0


def test_callback_endpoint(client):
    """Test GET /callback receives request_token and exchanges it successfully."""
    res = client.get("/callback?request_token=mock_req_token_xyz987")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "Paytm Money Connected" in res.text
    assert "AUTH SUCCESSFUL" in res.text

    # Verify session is now valid
    assert token_store.is_authenticated()
    assert token_store.get_access_token() is not None


def test_paytm_api_status_and_login_url(client):
    """Test /api/paytm/status and /api/paytm/login routes."""
    status_res = client.get("/api/paytm/status")
    assert status_res.status_code == 200
    data = status_res.json()
    assert "configured" in data
    assert "authenticated" in data
    assert data["feed"] == "NSE/BSE"
    assert "login_url" in data

    login_res = client.get("/api/paytm/login?redirect=false")
    assert login_res.status_code == 200
    assert "login_url" in login_res.json()


def test_paytm_exchange_and_logout_endpoints(client):
    """Test POST /api/paytm/exchange and POST /api/paytm/logout."""
    ex_res = client.post("/api/paytm/exchange", json={"request_token": "manual_token_abc"})
    assert ex_res.status_code == 200
    assert ex_res.json()["status"] == "success"
    assert token_store.is_authenticated()

    logout_res = client.post("/api/paytm/logout")
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "success"
    assert not token_store.is_authenticated()


def test_instruments_paytm_endpoints(client):
    """Test /api/instruments/paytm/status and /api/instruments/sync-paytm."""
    status_res = client.get("/api/instruments/paytm/status")
    assert status_res.status_code == 200
    assert status_res.json()["feed"] == "NSE/BSE"

    sync_res = client.post("/api/instruments/sync-paytm")
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["synced_count"] > 0
    assert "RELIANCE" in sync_data["updated_instruments"]

    # Test quote endpoint
    quote_res = client.get("/api/instruments/RELIANCE/quote")
    assert quote_res.status_code == 200
    quote = quote_res.json()
    assert quote["symbol"] == "RELIANCE"
    assert quote["exchange"] == "NSE"
    assert quote["currency"] == "INR"
    assert float(quote["current_price"]) > 0

    # Test historical bars endpoint
    bars_res = client.get("/api/instruments/RELIANCE/bars?limit=10")
    assert bars_res.status_code == 200
    bars_data = bars_res.json()
    assert bars_data["symbol"] == "RELIANCE"
    assert len(bars_data["bars"]) > 0


def test_websocket_client_lifecycle():
    """Verify background PaytmWebSocketClient starts and stops cleanly."""
    paytm_ws_client.start()
    assert paytm_ws_client._running is True
    paytm_ws_client.stop()
    assert paytm_ws_client._running is False
