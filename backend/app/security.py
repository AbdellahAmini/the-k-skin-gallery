import os
from datetime import datetime, timedelta, timezone
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from .database import get_db
from .models import User


hasher = PasswordHasher()
COOKIE = "gallery_session"
SECRET = os.getenv("JWT_SECRET", "local-dev-only-change-this-secret-before-deployment")
if os.getenv("APP_ENV") == "production" and (SECRET.startswith("local-dev-only") or len(SECRET) < 32):
    raise RuntimeError("Set a unique JWT_SECRET of at least 32 characters in production")


def hash_password(password: str) -> str:
    return hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return hasher.verify(hashed, password)
    except (VerifyMismatchError, ValueError):
        return False


def issue_token(user: User) -> str:
    return jwt.encode({"sub": str(user.id), "role": user.role,
        "exp": datetime.now(timezone.utc) + timedelta(days=14)}, SECRET, algorithm="HS256")


def current_user_optional(request: Request, db: Session = Depends(get_db)) -> User | None:
    token = request.cookies.get(COOKIE)
    if not token:
        return None
    try:
        data = jwt.decode(token, SECRET, algorithms=["HS256"])
        return db.get(User, int(data["sub"]))
    except (jwt.InvalidTokenError, ValueError, KeyError):
        return None


def current_user(user: User | None = Depends(current_user_optional)) -> User:
    if not user:
        raise HTTPException(401, "Connectez-vous pour continuer.")
    return user


def admin_user(user: User = Depends(current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "Accès administrateur requis.")
    return user
