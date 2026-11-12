def test_register_user_creates_starter_wallet(client):
    res = client.post("/api/auth/register", json={
        "username": "janedoe",
        "email": "janedoe@example.com",
        "password": "Password123!",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["username"] == "janedoe"
    assert data["email"] == "janedoe@example.com"
    assert data["wallet_balance"] == 10000.0


def test_register_duplicate_username_fails(client):
    payload = {
        "username": "uniqueuser",
        "email": "unique1@example.com",
        "password": "Password123!",
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    payload["email"] = "unique2@example.com"
    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "Username already taken" in res2.json()["detail"]


def test_login_success_and_get_profile(client):
    client.post("/api/auth/register", json={
        "username": "traderbob",
        "email": "bob@example.com",
        "password": "Password123!",
    })

    login_res = client.post("/api/auth/login", data={"username": "traderbob", "password": "Password123!"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "traderbob"
    assert me_res.json()["wallet_balance"] == 10000.0
