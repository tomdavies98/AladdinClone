from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.db import csv_store

router = APIRouter()


class ScenarioCreate(BaseModel):
    name: str
    scenario_type: str = "stress"
    params_json: str = "{}"


class ScenarioUpdate(BaseModel):
    name: str | None = None
    scenario_type: str | None = None
    params_json: str | None = None


class ResultCreate(BaseModel):
    scenario_id: str
    portfolio_id: str
    metric: str
    value: str


@router.get("/scenarios")
def list_scenarios(user_id: str = Depends(get_current_user_id)):
    return csv_store.get_by_user("risk_scenarios", user_id)


@router.post("/scenarios")
def create_scenario(
    body: ScenarioCreate,
    user_id: str = Depends(get_current_user_id),
):
    row = {
        "id": csv_store.generate_id(),
        "user_id": user_id,
        "name": body.name,
        "scenario_type": body.scenario_type,
        "params_json": body.params_json,
    }
    csv_store.append_row("risk_scenarios", row)
    return row


@router.get("/scenarios/{scenario_id}")
def get_scenario(
    scenario_id: str,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("risk_scenarios", user_id)
    for r in rows:
        if r.get("id") == scenario_id:
            return r
    raise HTTPException(status_code=404, detail="Scenario not found")


@router.put("/scenarios/{scenario_id}")
def update_scenario(
    scenario_id: str,
    body: ScenarioUpdate,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("risk_scenarios", user_id)
    if not any(r.get("id") == scenario_id for r in rows):
        raise HTTPException(status_code=404, detail="Scenario not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("risk_scenarios", "id", scenario_id, updates)
    rows = csv_store.get_by_user("risk_scenarios", user_id)
    return next(r for r in rows if r.get("id") == scenario_id)


@router.delete("/scenarios/{scenario_id}")
def delete_scenario(
    scenario_id: str,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("risk_scenarios", user_id)
    if not any(r.get("id") == scenario_id for r in rows):
        raise HTTPException(status_code=404, detail="Scenario not found")
    csv_store.delete_row("risk_scenarios", "id", scenario_id)
    results = csv_store.get_by_user("risk_results", user_id)
    for res in results:
        if res.get("scenario_id") == scenario_id:
            csv_store.delete_row("risk_results", "id", res["id"])
    return None


@router.get("/scenarios/{scenario_id}/results")
def list_results(
    scenario_id: str,
    user_id: str = Depends(get_current_user_id),
):
    scenarios = csv_store.get_by_user("risk_scenarios", user_id)
    if not any(s.get("id") == scenario_id for s in scenarios):
        raise HTTPException(status_code=404, detail="Scenario not found")
    results = csv_store.get_by_user("risk_results", user_id)
    return [r for r in results if r.get("scenario_id") == scenario_id]


@router.post("/results")
def create_result(
    body: ResultCreate,
    user_id: str = Depends(get_current_user_id),
):
    row = {
        "id": csv_store.generate_id(),
        "user_id": user_id,
        "scenario_id": body.scenario_id,
        "portfolio_id": body.portfolio_id,
        "metric": body.metric,
        "value": body.value,
    }
    csv_store.append_row("risk_results", row)
    return row


@router.delete("/results/{result_id}")
def delete_result(
    result_id: str,
    user_id: str = Depends(get_current_user_id),
):
    results = csv_store.get_by_user("risk_results", user_id)
    if not any(r.get("id") == result_id for r in results):
        raise HTTPException(status_code=404, detail="Result not found")
    csv_store.delete_row("risk_results", "id", result_id)
    return None
