def test_buy_stock_success(client, auth_headers):
    # Buy 5 shares of ITC (₹296.60 each = ₹1,483.00)
    res = client.post("/api/orders", json={
        "symbol": "ITC",
        "order_type": "buy",
        "quantity": 5,
    }, headers=auth_headers)
    assert res.status_code == 201
    order = res.json()
    assert order["symbol"] == "ITC"
    assert order["quantity"] == 5
    assert order["status"] == "executed"

    # Verify Wallet Balance (10000 - 1483.00 = 8517.00)
    wallet_res = client.get("/api/wallet/me", headers=auth_headers)
    assert wallet_res.status_code == 200
    assert float(wallet_res.json()["balance"]) == 8517.00

    # Verify Portfolio Summary
    port_res = client.get("/api/portfolio/summary", headers=auth_headers)
    assert port_res.status_code == 200
    port = port_res.json()
    assert float(port["cash_balance"]) == 8517.00
    assert float(port["current_portfolio_value"]) == 1483.00
    assert float(port["net_worth"]) == 10000.00
    assert len(port["holdings"]) == 1
    assert port["holdings"][0]["symbol"] == "ITC"
    assert port["holdings"][0]["quantity"] == 5


def test_buy_insufficient_funds_rejected(client, auth_headers):
    # Attempt to buy 10,000 shares of RELIANCE (₹29,805,000) with only ₹10,000 balance
    res = client.post("/api/orders", json={
        "symbol": "RELIANCE",
        "order_type": "buy",
        "quantity": 10000,
    }, headers=auth_headers)
    assert res.status_code == 400
    assert res.json()["error_code"] == "INSUFFICIENT_FUNDS"


def test_sell_stock_success(client, auth_headers):
    # First buy 10 shares of ITC
    client.post("/api/orders", json={
        "symbol": "ITC",
        "order_type": "buy",
        "quantity": 10,
    }, headers=auth_headers)

    # Now sell 4 shares of ITC
    sell_res = client.post("/api/orders", json={
        "symbol": "ITC",
        "order_type": "sell",
        "quantity": 4,
    }, headers=auth_headers)
    assert sell_res.status_code == 201
    assert sell_res.json()["order_type"] == "sell"
    assert sell_res.json()["quantity"] == 4

    # Verify 6 shares remain
    port_res = client.get("/api/portfolio/summary", headers=auth_headers)
    assert port_res.status_code == 200
    holdings = port_res.json()["holdings"]
    assert len(holdings) == 1
    assert holdings[0]["quantity"] == 6


def test_sell_insufficient_shares_rejected(client, auth_headers):
    # User owns 0 shares of SBIN; attempt selling 1 share
    res = client.post("/api/orders", json={
        "symbol": "SBIN",
        "order_type": "sell",
        "quantity": 1,
    }, headers=auth_headers)
    assert res.status_code == 400
    assert res.json()["error_code"] == "INSUFFICIENT_SHARES"
