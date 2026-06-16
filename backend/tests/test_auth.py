"""
Integration tests for the authentication endpoints (register, login, profile).
"""


def test_register_creates_user_and_returns_token(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Alice Student", "email": "alice@example.com", "password": "password123"},
    )

    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["role"] == "student"


def test_register_duplicate_email_fails(client):
    payload = {"name": "Bob", "email": "bob@example.com", "password": "password123"}
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 400


def test_login_with_correct_credentials(client):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Carol", "email": "carol@example.com", "password": "password123"},
    )

    response = client.post(
        "/api/v1/auth/login", json={"email": "carol@example.com", "password": "password123"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_login_with_wrong_password_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Dave", "email": "dave@example.com", "password": "password123"},
    )

    response = client.post(
        "/api/v1/auth/login", json={"email": "dave@example.com", "password": "wrongpass"}
    )

    assert response.status_code == 401


def test_get_profile_requires_authentication(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_get_profile_with_valid_token(client):
    register_response = client.post(
        "/api/v1/auth/register",
        json={"name": "Eve", "email": "eve@example.com", "password": "password123"},
    )
    token = register_response.json()["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == "eve@example.com"
