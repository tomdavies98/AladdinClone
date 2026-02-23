"""Tests for auth endpoints: login, register, and protected-route behavior."""


def test_login_success(client):
    """Demo user is created by lifespan; login with demo/demo returns token and user info."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "demo"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user_id"]
    assert data["display_name"]


def test_login_failure_wrong_password(client):
    """Login with correct username but wrong password returns 401."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "wrong"},
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json().get("detail", "")


def test_login_failure_unknown_user(client):
    """Login with non-existent username returns 401."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "nobody", "password": "any"},
    )
    assert response.status_code == 401


def test_protected_route_without_token(client):
    """Requesting a protected endpoint without Authorization header returns 401."""
    response = client.get("/api/v1/portfolios")
    assert response.status_code == 401
    detail = response.json().get("detail", "")
    assert "authenticated" in detail.lower() or "Not authenticated" in detail


def test_protected_route_with_invalid_token(client):
    """Requesting a protected endpoint with an invalid Bearer token returns 401."""
    response = client.get(
        "/api/v1/portfolios",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401
    detail = response.json().get("detail", "")
    assert "token" in detail.lower() or "Invalid" in detail


def test_protected_route_with_valid_token(client, auth_headers):
    """Requesting a protected endpoint with valid token succeeds."""
    response = client.get("/api/v1/portfolios", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_register_success(client):
    """Register creates a new user and returns token and user info."""
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "newuser", "password": "newpass", "display_name": "New User"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["user_id"]
    assert data["display_name"] == "New User"
    # New user can call protected endpoint with returned token
    token = data["access_token"]
    list_resp = client.get("/api/v1/portfolios", headers={"Authorization": f"Bearer {token}"})
    assert list_resp.status_code == 200


def test_register_duplicate_username(client):
    """Register with an existing username returns 400."""
    client.post(
        "/api/v1/auth/register",
        json={"username": "dup", "password": "pass", "display_name": "Dup"},
    )
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "dup", "password": "other", "display_name": "Dup Again"},
    )
    assert response.status_code == 400
    assert "already taken" in response.json().get("detail", "").lower()
