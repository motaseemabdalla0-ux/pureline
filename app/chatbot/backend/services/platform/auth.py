"""Minimal admin-session auth.

No user table / full auth system — a single shared admin password (env var
``ADMIN_PASSWORD``, defaults to a dev value) issues an HMAC-signed, expiring
token. This is a pragmatic scope choice for an internal single-admin portal,
not a multi-user identity system. Documented in docs/PLATFORM.md.
"""
import hashlib
import hmac
import os
import time

from fastapi import HTTPException, Header

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "pureline-admin-2026")
SECRET = os.getenv("ADMIN_TOKEN_SECRET", "pureline-dev-secret-change-me")
TOKEN_TTL_SECONDS = 60 * 60 * 12  # 12h session


def issue_token() -> str:
    expiry = int(time.time()) + TOKEN_TTL_SECONDS
    sig = hmac.new(SECRET.encode(), str(expiry).encode(), hashlib.sha256).hexdigest()
    return f"{expiry}.{sig}"


def verify_token(token: str) -> bool:
    try:
        expiry_str, sig = token.split(".", 1)
        expiry = int(expiry_str)
    except (ValueError, AttributeError):
        return False
    if time.time() > expiry:
        return False
    expected = hmac.new(SECRET.encode(), str(expiry).encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected)


def require_admin(authorization: str | None = Header(default=None)) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing admin token")
    token = authorization.removeprefix("Bearer ").strip()
    if not verify_token(token):
        raise HTTPException(status_code=401, detail="Invalid or expired admin session")
