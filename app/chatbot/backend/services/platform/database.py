"""SQLAlchemy engine/session setup for the Pure Line Services Platform.

Reuses the ``db`` (Postgres) container already defined in docker-compose.yml
and the ``DATABASE_URL`` env var already wired to chatbot-backend — no new
infrastructure. Falls back to a local SQLite file for `python main.py` runs
outside Docker (e.g. quick local testing) so the module never hard-fails.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pureline_platform.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import models so they're registered on Base.metadata before create_all.
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
