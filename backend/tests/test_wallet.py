def test_wallet_deposit_and_withdraw(client, auth_headers):
    # Deposit $5,000 (10000 + 5000 = 15000)
    dep_res = client.post("/api/wallet/deposit", json={"amount": 5000.00}, headers=auth_headers)
    assert dep_res.status_code == 200
    assert float(dep_res.json()["balance"]) == 15000.00

    # Withdraw $2,500 (15000 - 2500 = 12500)
    wth_res = client.post("/api/wallet/withdraw", json={"amount": 2500.00}, headers=auth_headers)
    assert wth_res.status_code == 200
    assert float(wth_res.json()["balance"]) == 12500.00

    # Check transactions ledger
    tx_res = client.get("/api/wallet/transactions", headers=auth_headers)
    assert tx_res.status_code == 200
    txs = tx_res.json()
    assert len(txs) >= 3  # Initial starter deposit + deposit + withdraw


def test_wallet_withdraw_insufficient_funds(client, auth_headers):
    # Attempt withdrawing $50,000 with only $10,000 in wallet
    res = client.post("/api/wallet/withdraw", json={"amount": 50000.00}, headers=auth_headers)
    assert res.status_code == 400
    assert res.json()["error_code"] == "INSUFFICIENT_FUNDS"
