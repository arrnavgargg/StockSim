from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# Determine engine parameters based on dialect
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    connect_args=connect_args,
    pool_pre_ping=True,
)

# Session factory used by FastAPI dependencies
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all model definitions
Base = declarative_base()


def get_db():
    """FastAPI dependency for acquiring database sessions with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
