"""
Seed script: creates data/ and users.csv with a default user if not present.
Run from repo root: python -m scripts.seed_data
Or from backend: python scripts/seed_data.py (ensure app is on path or run from backend dir)
"""
import sys
from pathlib import Path

# Allow importing app when run as script
backend = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend))

from app.core.config import settings
from app.core.auth import hash_password
from app.db import csv_store

def main():
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    users = csv_store.read_table("users")
    if not users:
        csv_store.append_row("users", {
            "id": csv_store.generate_id(),
            "username": "demo",
            "password_hash": hash_password("demo"),
            "display_name": "Demo User",
        })
        print("Created default user: demo / demo")
    else:
        print("Users already exist, skipping seed.")

if __name__ == "__main__":
    main()
