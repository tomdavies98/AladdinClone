"""Tests for portfolios API: full CRUD and user isolation."""


def test_create_portfolio(client, auth_headers):
    """Create a portfolio and assert response shape and list includes it."""
    response = client.post(
        "/api/v1/portfolios",
        headers=auth_headers,
        json={"name": "My Portfolio", "currency": "USD"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "My Portfolio"
    assert data["currency"] == "USD"
    assert data.get("id")
    assert data.get("user_id")
    assert data.get("created_at")

    list_resp = client.get("/api/v1/portfolios", headers=auth_headers)
    assert list_resp.status_code == 200
    portfolios = list_resp.json()
    assert len(portfolios) >= 1
    ids = [p["id"] for p in portfolios]
    assert data["id"] in ids


def test_get_portfolio(client, auth_headers):
    """Create then get a portfolio by id."""
    create = client.post(
        "/api/v1/portfolios",
        headers=auth_headers,
        json={"name": "Get Test", "currency": "EUR"},
    )
    assert create.status_code == 200
    pid = create.json()["id"]

    get_resp = client.get(f"/api/v1/portfolios/{pid}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == pid
    assert get_resp.json()["name"] == "Get Test"
    assert get_resp.json()["currency"] == "EUR"


def test_get_portfolio_not_found(client, auth_headers):
    """Get with non-existent id returns 404."""
    response = client.get(
        "/api/v1/portfolios/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert response.status_code == 404
    assert "not found" in response.json().get("detail", "").lower()


def test_update_portfolio(client, auth_headers):
    """Update portfolio name and currency."""
    create = client.post(
        "/api/v1/portfolios",
        headers=auth_headers,
        json={"name": "Original", "currency": "USD"},
    )
    pid = create.json()["id"]

    update = client.put(
        f"/api/v1/portfolios/{pid}",
        headers=auth_headers,
        json={"name": "Updated Name", "currency": "GBP"},
    )
    assert update.status_code == 200
    assert update.json()["name"] == "Updated Name"
    assert update.json()["currency"] == "GBP"

    get_resp = client.get(f"/api/v1/portfolios/{pid}", headers=auth_headers)
    assert get_resp.json()["name"] == "Updated Name"
    assert get_resp.json()["currency"] == "GBP"


def test_delete_portfolio(client, auth_headers):
    """Delete a portfolio; get then returns 404."""
    create = client.post(
        "/api/v1/portfolios",
        headers=auth_headers,
        json={"name": "To Delete", "currency": "USD"},
    )
    pid = create.json()["id"]

    del_resp = client.delete(f"/api/v1/portfolios/{pid}", headers=auth_headers)
    assert del_resp.status_code == 200

    get_resp = client.get(f"/api/v1/portfolios/{pid}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_user_isolation_user_b_cannot_see_user_a_portfolio(client, auth_headers, other_user_token):
    """User A creates a portfolio; User B cannot see it or access it by id."""
    # User A (demo) creates a portfolio
    create = client.post(
        "/api/v1/portfolios",
        headers=auth_headers,
        json={"name": "User A Only", "currency": "USD"},
    )
    assert create.status_code == 200
    pid = create.json()["id"]

    # User B (otheruser) lists portfolios — should not see User A's
    list_b = client.get(
        "/api/v1/portfolios",
        headers={"Authorization": f"Bearer {other_user_token}"},
    )
    assert list_b.status_code == 200
    ids_b = [p["id"] for p in list_b.json()]
    assert pid not in ids_b

    # User B tries to get User A's portfolio by id — 404 (not 403, as we don't leak existence)
    get_b = client.get(
        f"/api/v1/portfolios/{pid}",
        headers={"Authorization": f"Bearer {other_user_token}"},
    )
    assert get_b.status_code == 404


def test_user_isolation_user_b_cannot_update_or_delete_user_a_portfolio(
    client, auth_headers, other_user_token
):
    """User B cannot update or delete User A's portfolio."""
    create = client.post(
        "/api/v1/portfolios",
        headers=auth_headers,
        json={"name": "A's Portfolio", "currency": "USD"},
    )
    pid = create.json()["id"]

    update_b = client.put(
        f"/api/v1/portfolios/{pid}",
        headers={"Authorization": f"Bearer {other_user_token}"},
        json={"name": "Hacked"},
    )
    assert update_b.status_code == 404

    delete_b = client.delete(
        f"/api/v1/portfolios/{pid}",
        headers={"Authorization": f"Bearer {other_user_token}"},
    )
    assert delete_b.status_code == 404

    # User A still sees it
    get_a = client.get(f"/api/v1/portfolios/{pid}", headers=auth_headers)
    assert get_a.status_code == 200
    assert get_a.json()["name"] == "A's Portfolio"
