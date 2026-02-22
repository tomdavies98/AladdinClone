import csv
import os
import tempfile
import uuid
from pathlib import Path
from typing import Any

from app.core.config import settings

# Table name -> list of column names (order matters for CSV header)
TABLE_SCHEMAS: dict[str, list[str]] = {
    "users": ["id", "username", "password_hash", "display_name"],
    "portfolios": ["id", "user_id", "name", "currency", "created_at"],
    "holdings": ["id", "portfolio_id", "user_id", "symbol", "asset_class", "quantity", "avg_cost"],
    "risk_scenarios": ["id", "user_id", "name", "scenario_type", "params_json"],
    "risk_results": ["id", "user_id", "scenario_id", "portfolio_id", "metric", "value"],
    "orders": ["id", "user_id", "portfolio_id", "symbol", "side", "quantity", "order_type", "status", "created_at"],
    "accounts": ["id", "user_id", "name", "account_type", "currency"],
    "transactions": ["id", "user_id", "account_id", "type", "amount", "date", "description"],
    "funds": ["id", "user_id", "name", "strategy", "vintage_year"],
    "commitments": ["id", "user_id", "fund_id", "amount", "currency", "date"],
    "saved_reports": ["id", "user_id", "name", "report_type", "config_json", "created_at"],
    "portfolio_esg": ["id", "user_id", "portfolio_id", "score_type", "value", "as_of_date"],
    "model_portfolios": ["id", "user_id", "name", "allocation_json"],
    "client_accounts": ["id", "user_id", "model_id", "name"],
    "integrations": ["id", "user_id", "provider", "integration_type", "status", "config_json"],
    "user_preferences": ["user_id", "key", "value"],
    "design_principles_preferences": ["user_id", "key", "value"],
}


def _table_path(name: str) -> Path:
    path = Path(settings.data_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path / f"{name}.csv"


def _ensure_headers(path: Path, columns: list[str]) -> None:
    if not path.exists() or path.stat().st_size == 0:
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=columns)
            writer.writeheader()


def _get_columns(name: str) -> list[str]:
    if name not in TABLE_SCHEMAS:
        raise ValueError(f"Unknown table: {name}")
    return TABLE_SCHEMAS[name].copy()


def read_table(name: str) -> list[dict[str, Any]]:
    """Read all rows from a CSV table. Returns list of dicts (keys = column names)."""
    path = _table_path(name)
    columns = _get_columns(name)
    _ensure_headers(path, columns)
    rows: list[dict[str, Any]] = []
    with open(path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f, fieldnames=columns)
        next(reader, None)  # skip header
        for row in reader:
            if any(row.get(c) for c in columns):
                rows.append(row)
    return rows


def write_table(name: str, rows: list[dict[str, Any]]) -> None:
    """Overwrite table with given rows. Atomic write (temp file then replace)."""
    path = _table_path(name)
    columns = _get_columns(name)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".csv_", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=columns, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(tmp, path)
    except Exception:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def append_row(name: str, row: dict[str, Any]) -> None:
    """Append one row. Row must contain all columns; id can be generated if missing."""
    columns = _get_columns(name)
    path = _table_path(name)
    _ensure_headers(path, columns)
    if "id" in columns and (not row.get("id")):
        row = {**row, "id": str(uuid.uuid4())}
    out = {c: row.get(c, "") for c in columns}
    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns, extrasaction="ignore")
        writer.writerow(out)


def update_row(name: str, id_field: str, id_value: str, updates: dict[str, Any]) -> bool:
    """Update the first row where id_field == id_value. Returns True if a row was updated."""
    rows = read_table(name)
    columns = _get_columns(name)
    for i, row in enumerate(rows):
        if str(row.get(id_field, "")) == str(id_value):
            for k, v in updates.items():
                if k in columns:
                    rows[i][k] = v
            write_table(name, rows)
            return True
    return False


def delete_row(name: str, id_field: str, id_value: str) -> bool:
    """Remove the first row where id_field == id_value. Returns True if a row was removed."""
    rows = read_table(name)
    new_rows = [r for r in rows if str(r.get(id_field, "")) != str(id_value)]
    if len(new_rows) == len(rows):
        return False
    write_table(name, new_rows)
    return True


def get_by_user(table: str, user_id: str) -> list[dict[str, Any]]:
    """Return rows where user_id column equals user_id."""
    rows = read_table(table)
    return [r for r in rows if r.get("user_id") == user_id]


def generate_id() -> str:
    return str(uuid.uuid4())
