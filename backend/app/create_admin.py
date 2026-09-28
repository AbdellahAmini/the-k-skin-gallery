"""Create the first administrator from a trusted backend terminal.

Run after Alembic upgrade (production) or local API initialization. Passwords
are prompted interactively so they do not appear in shell history or process args.
"""

import argparse
import getpass
import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import User
from .security import hash_password


def create_admin(db: Session, email: str, password: str, first_name: str, last_name: str) -> User:
    email = email.strip().lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise ValueError("Invalid email address.")
    if len(password) < 10:
        raise ValueError("Password must have at least 10 characters.")
    if not first_name.strip() or not last_name.strip():
        raise ValueError("First and last name are required.")
    if db.scalar(select(User).where(User.email == email)):
        raise ValueError("An account already uses this email. Choose a new email.")
    user = User(email=email, password_hash=hash_password(password),
                first_name=first_name.strip(), last_name=last_name.strip(), role="admin")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def main():
    parser = argparse.ArgumentParser(description="Create a Gallery administrator")
    parser.add_argument("email")
    parser.add_argument("--first-name", required=True)
    parser.add_argument("--last-name", required=True)
    args = parser.parse_args()
    password = getpass.getpass("New admin password: ")
    confirmation = getpass.getpass("Confirm password: ")
    if password != confirmation:
        parser.error("Passwords do not match.")
    try:
        with SessionLocal() as db:
            user = create_admin(db, args.email, password, args.first_name, args.last_name)
    except ValueError as cause:
        parser.error(str(cause))
    print(f"Created administrator {user.email} (id {user.id}).")


if __name__ == "__main__":
    main()
