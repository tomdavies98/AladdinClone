from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.db import csv_store

router = APIRouter()


class ReportCreate(BaseModel):
    name: str
    report_type: str = "custom"
    config_json: str = "{}"


class ReportUpdate(BaseModel):
    name: str | None = None
    report_type: str | None = None
    config_json: str | None = None


@router.get("/reports")
def list_reports(user_id: str = Depends(get_current_user_id)):
    return csv_store.get_by_user("saved_reports", user_id)


@router.post("/reports")
def create_report(body: ReportCreate, user_id: str = Depends(get_current_user_id)):
    row = {
        "id": csv_store.generate_id(),
        "user_id": user_id,
        "name": body.name,
        "report_type": body.report_type,
        "config_json": body.config_json,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    csv_store.append_row("saved_reports", row)
    return row


@router.get("/reports/{report_id}")
def get_report(report_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("saved_reports", user_id)
    for r in rows:
        if r.get("id") == report_id:
            return r
    raise HTTPException(status_code=404, detail="Report not found")


@router.put("/reports/{report_id}")
def update_report(report_id: str, body: ReportUpdate, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("saved_reports", user_id)
    if not any(r.get("id") == report_id for r in rows):
        raise HTTPException(status_code=404, detail="Report not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("saved_reports", "id", report_id, updates)
    return next(r for r in csv_store.get_by_user("saved_reports", user_id) if r.get("id") == report_id)


@router.delete("/reports/{report_id}")
def delete_report(report_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("saved_reports", user_id)
    if not any(r.get("id") == report_id for r in rows):
        raise HTTPException(status_code=404, detail="Report not found")
    csv_store.delete_row("saved_reports", "id", report_id)
    return None
