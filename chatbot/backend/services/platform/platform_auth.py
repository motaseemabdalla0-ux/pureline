"""Unified, multi-user platform auth (admin / staff / customer).

This sits ALONGSIDE the existing single-shared-password admin auth in
``auth.py`` — that one is untouched and still gates the legacy ``/admin/*``
endpoints. This module adds a real (if intentionally lightweight) user
table + login flow for the Farm Operations Management Platform, where staff
(technicians/agronomists/inspectors) and customers need their own accounts.

Password hashing: PBKDF2-HMAC-SHA256 with a random per-user salt (stdlib
``hashlib`` only — no new dependency). Non-reversible, standard KDF with a
high iteration count; equivalent security posture to bcrypt for this scale.

Token format: ``{user_id}.{role}.{expiry}.{hmac_sig}`` — same style as the
existing admin token (``{expiry}.{sig}``), just carrying identity + role too.
"""
import hashlib
import hmac
import os
import secrets
import time

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from . import models, schemas
from .database import get_db

PLATFORM_SECRET = os.getenv("PLATFORM_TOKEN_SECRET", "pureline-platform-dev-secret-change-me")
TOKEN_TTL_SECONDS = 60 * 60 * 24  # 24h session
PBKDF2_ITERATIONS = 260_000

router = APIRouter(prefix="/auth", tags=["platform-auth"])


# ---------------------------------------------------------------- hashing --
def _hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), PBKDF2_ITERATIONS)
    return digest.hex(), salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    candidate, _ = _hash_password(password, salt)
    return hmac.compare_digest(candidate, password_hash)


# ------------------------------------------------------------------ token --
def issue_platform_token(user_id: int, role: str) -> str:
    expiry = int(time.time()) + TOKEN_TTL_SECONDS
    payload = f"{user_id}.{role}.{expiry}"
    sig = hmac.new(PLATFORM_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def verify_platform_token(token: str) -> dict | None:
    try:
        user_id_str, role, expiry_str, sig = token.split(".", 3)
        user_id = int(user_id_str)
        expiry = int(expiry_str)
    except (ValueError, AttributeError, TypeError):
        return None
    if time.time() > expiry:
        return None
    payload = f"{user_id_str}.{role}.{expiry_str}"
    expected = hmac.new(PLATFORM_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    return {"user_id": user_id, "role": role, "expiry": expiry}


# ------------------------------------------------------------- dependency --
def get_current_platform_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> models.PlatformUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing platform token")
    token = authorization.removeprefix("Bearer ").strip()
    claims = verify_platform_token(token)
    if not claims:
        raise HTTPException(401, "Invalid or expired session")
    user = db.query(models.PlatformUser).filter(models.PlatformUser.id == claims["user_id"]).first()
    if not user:
        raise HTTPException(401, "User no longer exists")
    if user.is_active is False:
        raise HTTPException(401, "Account is deactivated")
    return user


def require_platform_user(roles: list[str] | None = None):
    """FastAPI dependency factory — gate an endpoint to specific roles.

    Usage: ``Depends(require_platform_user(["staff", "admin"]))``.
    Pass ``None`` (default) to just require any valid logged-in user.
    """
    def _dependency(user: models.PlatformUser = Depends(get_current_platform_user)) -> models.PlatformUser:
        if roles:
            role_value = user.role.value if hasattr(user.role, "value") else user.role
            if role_value not in roles:
                raise HTTPException(403, f"This action requires one of these roles: {', '.join(roles)}")
        return user
    return _dependency


def _user_out(user: models.PlatformUser) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
    }


# ------------------------------------------------------------------ routes --
@router.post("/login", response_model=schemas.PlatformLoginOut)
def login(payload: schemas.PlatformLoginIn, db: Session = Depends(get_db)):
    user = db.query(models.PlatformUser).filter(models.PlatformUser.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash, user.password_salt):
        raise HTTPException(401, "Incorrect username or password")
    if user.is_active is False:
        raise HTTPException(401, "Account is deactivated")
    role_value = user.role.value if hasattr(user.role, "value") else user.role
    token = issue_platform_token(user.id, role_value)
    return {"token": token, "user": _user_out(user)}


@router.get("/me")
def me(user: models.PlatformUser = Depends(get_current_platform_user)):
    return _user_out(user)


# ----------------------------------------------------------------- helper --
def create_platform_user(
    db: Session, username: str, email: str, password: str, full_name: str,
    role: models.PlatformRole, staff_title: str | None = None, phone: str | None = None,
) -> models.PlatformUser:
    password_hash, salt = _hash_password(password)
    user = models.PlatformUser(
        username=username, email=email, password_hash=password_hash, password_salt=salt,
        full_name=full_name, role=role, staff_title=staff_title, phone=phone,
    )
    db.add(user)
    return user
