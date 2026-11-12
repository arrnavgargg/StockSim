def test_buy_stock_success(client, auth_headers):
    # Buy 5 shares of AAPL ($182.50 each = $912.50)
    res = client.post("/api/orders", json={
        "symbol": "AAPL",
        "order_type": "buy",
        "quantity": 5,
    }, headers=auth_headers)
    assert res.status_code == 201
    order = res.json()
    assert order["symbol"] == "AAPL"
    assert order["quantity"] == 5
    assert order["status"] == "executed"

    # Verify Wallet Balance (10000 - 912.50 = 9087.50)
    wallet_res = client.get("/api/wallet/me", headers=auth_headers)
    assert wallet_res.status_code == 200
    assert float(wallet_res.json()["balance"]) == 9087.50

    # Verify Portfolio Summary
    port_res = client.get("/api/portfolio/summary", headers=auth_headers)
    assert port_res.status_code == 200
    port = port_res.json()
    assert float(port["cash_balance"]) == 9087.50
    assert float(port["current_portfolio_value"]) == 912.50
    assert float(port["net_worth"]) == 10000.00
    assert len(port["holdings"]) == 1
    assert port["holdings"][0]["symbol"] == "AAPL"
    assert port["holdings"][0]["quantity"] == 5


def test_buy_insufficient_funds_rejected(client, auth_headers):
    # Attempt to buy 10,000 shares of AAPL ($1,825,000) with only $10,000 balance
    res = client.post("/api/orders", json={
        "symbol": "AAPL",
        "order_type": "buy",
        "quantity": 10000,
    }, headers=auth_headers)
    assert res.status_code == 400
    assert res.json()["error_code"] == "INSUFFICIENT_FUNDS"


def test_sell_stock_success(client, auth_headers):
    # First buy 10 shares of AAPL
    client.post("/api/orders", json={
        "symbol": "AAPL",
        "order_type": "buy",
        "quantity": 10,
    }, headers=auth_headers)

    # Now sell 4 shares of AAPL
    sell_res = client.post("/api/orders", json={
        "symbol": "AAPL",
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
    # User owns 0 shares of TSLA; attempt selling 1 share
    res = client.post("/api/orders", json={
        "symbol": "TSLA",
        "order_type": "sell",
        "quantity": 1,
    }, headers=auth_headers)
    assert res.status_code == 400
    assert res.json()["error_code"] == "INSUFFICIENT_SHARES"
