import os
import shutil
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip()

if not DATABASE_URL or DATABASE_URL.startswith("sqlite"):
    backend_dir = Path(__file__).resolve().parents[1]
    bundled_db = backend_dir / "gallery.db"
    
    # On Vercel / AWS Lambda, the app code filesystem (/var/task) is read-only.
    # Copy the bundled SQLite database to /tmp/gallery.db where SQLite has full read/write access.
    is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME") or not os.access(backend_dir, os.W_OK))
    if is_serverless and bundled_db.exists():
        tmp_db = Path("/tmp/gallery.db")
        if not tmp_db.exists() or bundled_db.stat().st_mtime > tmp_db.stat().st_mtime:
            shutil.copy2(bundled_db, tmp_db)
        db_path = tmp_db
    elif bundled_db.exists():
        db_path = bundled_db
    else:
        db_path = Path("gallery.db").resolve()

    DATABASE_URL = f"sqlite:///{db_path.as_posix()}"
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1
    )

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    with SessionLocal() as db:
        yield db
