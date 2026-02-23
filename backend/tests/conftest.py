"""
Pytest configuration and shared fixtures for backend tests.

ALADDIN_DATA_DIR must be set before any app import so the CSV store uses
a temporary directory instead of the default backend/data.
"""
import os
import tempfile

import pytest
from fastapi.testclient import TestClient

# Use a dedicated temp dir for test data so we don't touch real data.
# Set before importing app so config and csv_store use it.
_test_data_dir = tempfile.mkdtemp(prefix="aladdin_tests_")
os.environ["ALADDIN_DATA_DIR"] = _test_data_dir

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    """Session-scoped TestClient. Lifespan runs on first request (demo user created)."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def auth_headers(client):
    """Log in as demo/demo and return headers with Bearer token for use in requests."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "demo", "password": "demo"},
    )
    assert response.status_code == 200
    data = response.json()
    token = data["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_user_token(client):
    """Second user token for isolation tests. Registers if needed, otherwise logs in."""
    register = client.post(
        "/api/v1/auth/register",
        json={"username": "otheruser", "password": "otherpass", "display_name": "Other User"},
    )
    if register.status_code == 200:
        return register.json()["access_token"]
    # Already registered (e.g. by another test); log in
    login = client.post(
        "/api/v1/auth/login",
        json={"username": "otheruser", "password": "otherpass"},
    )
    assert login.status_code == 200
    return login.json()["access_token"]
