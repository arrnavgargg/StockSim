"""Test Paytm Money Scrip Master & On-Demand NSE Stock Ingestion."""
import pytest
from app.services.scrip_master_service import scrip_master
from app.services.market_data_service import MarketDataService


def test_scrip_master_loaded():
    assert len(scrip_master.by_symbol) > 2000
    tata = scrip_master.get_by_symbol("TATASTEEL")
    assert tata is not None
    assert tata["symbol"] == "TATASTEEL"
    assert tata["exchange"] == "NSE"
    assert tata["security_id"] == 3499
    assert tata["price"] > 0


def test_scrip_master_search():
    matches = scrip_master.search("WIPRO", limit=5)
    assert len(matches) > 0
    assert matches[0]["symbol"] == "WIPRO"
    assert matches[0]["security_id"] == 3787


def test_on_demand_instrument_search_and_ingestion(client, db_session):
    # 1. Search for a stock not previously seeded, e.g. "TATASTEEL"
    res = client.get("/api/instruments?search=TATASTEEL")
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0
    symbols = [i["symbol"] for i in items]
    assert "TATASTEEL" in symbols

    # 2. Verify security_id is populated
    tata_item = next(i for i in items if i["symbol"] == "TATASTEEL")
    assert tata_item["security_id"] == 3499
    assert float(tata_item["current_price"]) > 0

    # 3. Verify quote can be fetched on-demand
    quote_res = client.get("/api/instruments/TATASTEEL/quote")
    assert quote_res.status_code == 200
    q = quote_res.json()
    assert q["symbol"] == "TATASTEEL"
    assert q["exchange"] == "NSE"
    assert q["security_id"] == 3499

