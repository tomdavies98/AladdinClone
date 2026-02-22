"""
Seed believable demo data for the demo user across all features.
Run from backend directory: python -m scripts.seed_demo_data
Creates demo user if missing, then clears and repopulates all demo data.
"""
import sys
from datetime import datetime, timezone
from pathlib import Path

backend = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend))

from app.core.config import settings
from app.core.auth import hash_password
from app.db import csv_store


DEMO_USERNAME = "demo"


def ensure_demo_user() -> str:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    users = csv_store.read_table("users")
    demo = next((u for u in users if u.get("username") == DEMO_USERNAME), None)
    if not demo:
        uid = csv_store.generate_id()
        csv_store.append_row("users", {
            "id": uid,
            "username": DEMO_USERNAME,
            "password_hash": hash_password("demo"),
            "display_name": "Demo User",
        })
        return uid
    return demo["id"]


def clear_demo_data(user_id: str) -> None:
    """Remove all rows belonging to the demo user from feature tables."""
    tables_with_user = [
        "holdings", "portfolios", "risk_results", "risk_scenarios", "orders",
        "transactions", "accounts", "commitments", "funds", "saved_reports",
        "portfolio_esg", "client_accounts", "model_portfolios", "integrations",
    ]
    for table in tables_with_user:
        rows = csv_store.read_table(table)
        kept = [r for r in rows if r.get("user_id") != user_id]
        csv_store.write_table(table, kept)
    prefs = csv_store.read_table("user_preferences")
    kept = [p for p in prefs if p.get("user_id") != user_id]
    csv_store.write_table("user_preferences", kept)
    dp_prefs = csv_store.read_table("design_principles_preferences")
    kept_dp = [p for p in dp_prefs if p.get("user_id") != user_id]
    csv_store.write_table("design_principles_preferences", kept_dp)


def seed_portfolios(user_id: str) -> list[str]:
    now = datetime.now(timezone.utc).isoformat()
    portfolios = [
        {"name": "US Growth", "currency": "USD"},
        {"name": "Global Balanced", "currency": "USD"},
        {"name": "Retirement Income", "currency": "USD"},
    ]
    ids = []
    for p in portfolios:
        row = {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "name": p["name"],
            "currency": p["currency"],
            "created_at": now,
        }
        csv_store.append_row("portfolios", row)
        ids.append(row["id"])
    return ids


def seed_holdings(user_id: str, portfolio_ids: list[str]) -> None:
    # US Growth: equity-heavy
    holdings_data = [
        (portfolio_ids[0], "VTI", "equity", "150", "245.50"),
        (portfolio_ids[0], "VEA", "equity", "200", "48.20"),
        (portfolio_ids[0], "QQQ", "equity", "25", "412.00"),
        (portfolio_ids[0], "VWO", "equity", "80", "44.10"),
        # Global Balanced
        (portfolio_ids[1], "VTI", "equity", "100", "245.50"),
        (portfolio_ids[1], "BND", "fixed_income", "120", "72.30"),
        (portfolio_ids[1], "VEA", "equity", "75", "48.20"),
        (portfolio_ids[1], "IUSB", "fixed_income", "50", "52.40"),
        # Retirement Income
        (portfolio_ids[2], "BND", "fixed_income", "200", "72.30"),
        (portfolio_ids[2], "VTI", "equity", "40", "245.50"),
        (portfolio_ids[2], "SCHD", "equity", "60", "82.15"),
    ]
    for pid, symbol, asset_class, qty, avg_cost in holdings_data:
        csv_store.append_row("holdings", {
            "id": csv_store.generate_id(),
            "portfolio_id": pid,
            "user_id": user_id,
            "symbol": symbol,
            "asset_class": asset_class,
            "quantity": qty,
            "avg_cost": avg_cost,
        })


def seed_risk_scenarios(user_id: str) -> list[str]:
    scenarios = [
        {"name": "Fed Rate Shock", "scenario_type": "stress", "params_json": '{"rate_change_bps": 100}'},
        {"name": "Global Market Correction", "scenario_type": "historical", "params_json": '{"drawdown_pct": 20}'},
        {"name": "Severely Adverse", "scenario_type": "stress", "params_json": '{"recession": true}'},
    ]
    ids = []
    for s in scenarios:
        row = {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "name": s["name"],
            "scenario_type": s["scenario_type"],
            "params_json": s["params_json"],
        }
        csv_store.append_row("risk_scenarios", row)
        ids.append(row["id"])
    return ids


def seed_risk_results(user_id: str, scenario_ids: list[str], portfolio_ids: list[str]) -> None:
    now = datetime.now(timezone.utc).isoformat()
    # Scenario 0: VaR and ES for first two portfolios
    for i, pid in enumerate(portfolio_ids[:2]):
        csv_store.append_row("risk_results", {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "scenario_id": scenario_ids[0],
            "portfolio_id": pid,
            "metric": "VaR_95_1d",
            "value": f"-{1.2 + i * 0.3}%",
        })
        csv_store.append_row("risk_results", {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "scenario_id": scenario_ids[0],
            "portfolio_id": pid,
            "metric": "Expected_Shortfall_95",
            "value": f"-{1.8 + i * 0.4}%",
        })
    # Scenario 1: concentration risk for first portfolio
    csv_store.append_row("risk_results", {
        "id": csv_store.generate_id(),
        "user_id": user_id,
        "scenario_id": scenario_ids[1],
        "portfolio_id": portfolio_ids[0],
        "metric": "Max_drawdown",
        "value": "-18.5%",
    })


def seed_orders(user_id: str, portfolio_ids: list[str]) -> None:
    now = datetime.now(timezone.utc).isoformat()
    orders = [
        (portfolio_ids[0], "VTI", "BUY", "10", "FILLED"),
        (portfolio_ids[0], "VEA", "BUY", "25", "FILLED"),
        (portfolio_ids[1], "BND", "BUY", "50", "NEW"),
        (portfolio_ids[2], "SCHD", "SELL", "20", "CANCELLED"),
    ]
    for pid, symbol, side, qty, status in orders:
        csv_store.append_row("orders", {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "portfolio_id": pid,
            "symbol": symbol,
            "side": side,
            "quantity": qty,
            "order_type": "MARKET",
            "status": status,
            "created_at": now,
        })


def seed_accounts(user_id: str) -> list[str]:
    accounts = [
        {"name": "Main Brokerage", "account_type": "brokerage", "currency": "USD"},
        {"name": "IRA Traditional", "account_type": "ira", "currency": "USD"},
        {"name": "Sweep Cash", "account_type": "cash", "currency": "USD"},
    ]
    ids = []
    for a in accounts:
        row = {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "name": a["name"],
            "account_type": a["account_type"],
            "currency": a["currency"],
        }
        csv_store.append_row("accounts", row)
        ids.append(row["id"])
    return ids


def seed_transactions(user_id: str, account_ids: list[str]) -> None:
    txns = [
        (account_ids[0], "buy", "12500.00", "2025-01-15", "VTI purchase"),
        (account_ids[0], "dividend", "342.50", "2025-02-01", "Quarterly dividend"),
        (account_ids[0], "sell", "-2100.00", "2025-02-10", "VEA partial sale"),
        (account_ids[1], "contribution", "7000.00", "2025-01-05", "IRA contribution"),
        (account_ids[1], "buy", "6800.00", "2025-01-06", "BND purchase"),
        (account_ids[2], "fee", "-25.00", "2025-02-01", "Account fee"),
    ]
    for aid, ttype, amount, date, desc in txns:
        csv_store.append_row("transactions", {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "account_id": aid,
            "type": ttype,
            "amount": amount,
            "date": date,
            "description": desc,
        })


def seed_funds(user_id: str) -> list[str]:
    funds = [
        {"name": "Blackstone Tactical Opportunities Fund IV", "strategy": "tactical_opportunities", "vintage_year": "2021"},
        {"name": "KKR Americas Fund XIII", "strategy": "buyout", "vintage_year": "2022"},
        {"name": "Carlyle Infrastructure Partners V", "strategy": "infrastructure", "vintage_year": "2023"},
    ]
    ids = []
    for f in funds:
        row = {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "name": f["name"],
            "strategy": f["strategy"],
            "vintage_year": f["vintage_year"],
        }
        csv_store.append_row("funds", row)
        ids.append(row["id"])
    return ids


def seed_commitments(user_id: str, fund_ids: list[str]) -> None:
    commitments = [
        (fund_ids[0], "5000000", "USD", "2021-06-15"),
        (fund_ids[0], "2500000", "USD", "2022-03-01"),
        (fund_ids[1], "10000000", "USD", "2022-09-01"),
        (fund_ids[2], "7500000", "USD", "2023-01-15"),
    ]
    for fid, amount, currency, date in commitments:
        csv_store.append_row("commitments", {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "fund_id": fid,
            "amount": amount,
            "currency": currency,
            "date": date,
        })


def seed_saved_reports(user_id: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    reports = [
        {"name": "Monthly Performance Summary", "report_type": "performance", "config_json": '{"period": "1M"}'},
        {"name": "Sector Attribution", "report_type": "attribution", "config_json": '{"benchmark": "SP500"}'},
        {"name": "Holdings Export", "report_type": "holdings", "config_json": '{"format": "csv"}'},
    ]
    for r in reports:
        csv_store.append_row("saved_reports", {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "name": r["name"],
            "report_type": r["report_type"],
            "config_json": r["config_json"],
            "created_at": now,
        })


def seed_portfolio_esg(user_id: str, portfolio_ids: list[str]) -> None:
    score_types = ["ESG", "Carbon", "Climate_VaR"]
    for pid in portfolio_ids:
        csv_store.append_row("portfolio_esg", {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "portfolio_id": pid,
            "score_type": "ESG",
            "value": "7.2",
            "as_of_date": "2025-02-01",
        })
        csv_store.append_row("portfolio_esg", {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "portfolio_id": pid,
            "score_type": "Carbon",
            "value": "125",
            "as_of_date": "2025-02-01",
        })


def seed_model_portfolios(user_id: str) -> list[str]:
    models = [
        {"name": "Moderate Growth 60/40", "allocation_json": '{"equity": 60, "fixed_income": 40}'},
        {"name": "Conservative Income", "allocation_json": '{"equity": 30, "fixed_income": 70}'},
        {"name": "Aggressive Growth", "allocation_json": '{"equity": 90, "fixed_income": 10}'},
    ]
    ids = []
    for m in models:
        row = {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "name": m["name"],
            "allocation_json": m["allocation_json"],
        }
        csv_store.append_row("model_portfolios", row)
        ids.append(row["id"])
    return ids


def seed_client_accounts(user_id: str, model_ids: list[str]) -> None:
    accounts = [
        (model_ids[0], "Smith Family Trust"),
        (model_ids[0], "Jones Retirement"),
        (model_ids[1], "Williams Income Account"),
        (model_ids[2], "Davis Growth LLC"),
    ]
    for mid, name in accounts:
        csv_store.append_row("client_accounts", {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "model_id": mid,
            "name": name,
        })


def seed_integrations(user_id: str) -> None:
    integrations = [
        {"provider": "State Street", "integration_type": "custodian", "status": "active", "config_json": "{}"},
        {"provider": "BNY Mellon", "integration_type": "custodian", "status": "active", "config_json": "{}"},
        {"provider": "Goldman Sachs Prime", "integration_type": "broker", "status": "active", "config_json": "{}"},
        {"provider": "Bloomberg", "integration_type": "data", "status": "active", "config_json": "{}"},
    ]
    for i in integrations:
        csv_store.append_row("integrations", {
            "id": csv_store.generate_id(),
            "user_id": user_id,
            "provider": i["provider"],
            "integration_type": i["integration_type"],
            "status": i["status"],
            "config_json": i["config_json"],
        })


def seed_user_preferences(user_id: str) -> None:
    prefs = [
        ("theme", "dark"),
        ("default_currency", "USD"),
        ("reporting_frequency", "monthly"),
        ("dashboard_layout", "sidebar"),
    ]
    for key, value in prefs:
        csv_store.append_row("user_preferences", {"user_id": user_id, "key": key, "value": value})


def seed_design_principles_preferences(user_id: str) -> None:
    """Seed design principles preferences (saved to design_principles_preferences table)."""
    prefs = [
        ("theme", "dark"),
        ("default_currency", "USD"),
        ("reporting_frequency", "monthly"),
        ("dashboard_layout", "sidebar"),
    ]
    for key, value in prefs:
        csv_store.append_row("design_principles_preferences", {"user_id": user_id, "key": key, "value": value})


def main() -> None:
    print("Ensuring demo user exists...")
    user_id = ensure_demo_user()
    print("Clearing existing demo data...")
    clear_demo_data(user_id)
    print("Seeding portfolios...")
    portfolio_ids = seed_portfolios(user_id)
    print("Seeding holdings...")
    seed_holdings(user_id, portfolio_ids)
    print("Seeding risk scenarios and results...")
    scenario_ids = seed_risk_scenarios(user_id)
    seed_risk_results(user_id, scenario_ids, portfolio_ids)
    print("Seeding orders...")
    seed_orders(user_id, portfolio_ids)
    print("Seeding accounts and transactions...")
    account_ids = seed_accounts(user_id)
    seed_transactions(user_id, account_ids)
    print("Seeding private market funds and commitments...")
    fund_ids = seed_funds(user_id)
    seed_commitments(user_id, fund_ids)
    print("Seeding saved reports...")
    seed_saved_reports(user_id)
    print("Seeding portfolio ESG scores...")
    seed_portfolio_esg(user_id, portfolio_ids)
    print("Seeding model portfolios and client accounts...")
    model_ids = seed_model_portfolios(user_id)
    seed_client_accounts(user_id, model_ids)
    print("Seeding integrations...")
    seed_integrations(user_id)
    print("Seeding user preferences...")
    seed_user_preferences(user_id)
    print("Seeding design principles preferences...")
    seed_design_principles_preferences(user_id)
    print("Done. Log in as demo / demo to see the data.")


if __name__ == "__main__":
    main()
