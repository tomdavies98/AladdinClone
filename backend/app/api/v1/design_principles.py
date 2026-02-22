from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.db import csv_store

router = APIRouter()


class PreferenceSet(BaseModel):
    key: str
    value: str


@router.get("/preferences")
def get_preferences(user_id: str = Depends(get_current_user_id)):
    # Prefer design_principles_preferences; fall back to user_preferences so existing/seed data is shown
    dp_rows = csv_store.get_by_user("design_principles_preferences", user_id)
    if dp_rows:
        return {r["key"]: r["value"] for r in dp_rows}
    up_rows = csv_store.get_by_user("user_preferences", user_id)
    if up_rows:
        # Migrate into design_principles_preferences so future reads use the new table
        all_dp = csv_store.read_table("design_principles_preferences")
        for r in up_rows:
            all_dp.append({"user_id": user_id, "key": r["key"], "value": r["value"]})
        csv_store.write_table("design_principles_preferences", all_dp)
    return {r["key"]: r["value"] for r in up_rows}


@router.put("/preferences")
def set_preference(body: PreferenceSet, user_id: str = Depends(get_current_user_id)):
    all_rows = csv_store.read_table("design_principles_preferences")
    found = False
    for i, r in enumerate(all_rows):
        if r.get("user_id") == user_id and r.get("key") == body.key:
            if body.value == "":
                all_rows.pop(i)
            else:
                all_rows[i]["value"] = body.value
            found = True
            break
    if not found and body.value:
        all_rows.append({"user_id": user_id, "key": body.key, "value": body.value})
    csv_store.write_table("design_principles_preferences", all_rows)
    return {"key": body.key, "value": body.value}


@router.delete("/preferences/{key}")
def delete_preference(key: str, user_id: str = Depends(get_current_user_id)):
    all_rows = csv_store.read_table("design_principles_preferences")
    new_rows = [r for r in all_rows if not (r.get("user_id") == user_id and r.get("key") == key)]
    csv_store.write_table("design_principles_preferences", new_rows)
    return None
