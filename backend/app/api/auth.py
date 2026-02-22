from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.auth import authenticate_user, create_access_token, hash_password
from app.db import csv_store

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    display_name: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    display_name: str


def _username_exists(username: str) -> bool:
    rows = csv_store.read_table("users")
    return any(r.get("username") == username for r in rows)


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token(user["id"])
    return LoginResponse(
        access_token=token,
        user_id=user["id"],
        display_name=user.get("display_name", user.get("username", "")),
    )


@router.post("/register", response_model=LoginResponse)
def register(req: RegisterRequest):
    if _username_exists(req.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )
    user_id = csv_store.generate_id()
    password_hash = hash_password(req.password)
    display_name = (req.display_name or req.username).strip() or req.username
    csv_store.append_row("users", {
        "id": user_id,
        "username": req.username.strip(),
        "password_hash": password_hash,
        "display_name": display_name,
    })
    token = create_access_token(user_id)
    return LoginResponse(
        access_token=token,
        user_id=user_id,
        display_name=display_name,
    )
