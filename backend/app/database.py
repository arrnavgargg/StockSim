import os
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

class Settings(BaseSettings):
    """Read environment variables (from .env) and provide defaults."""
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://stocksim_user:strong-password@localhost/stocksim?host=/tmp",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# SQLAlchemy engine
engine = create_engine(settings.DATABASE_URL, echo=True)

# Session factory used by FastAPI dependencies
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all model definitions
Base = declarative_base()

# FastAPI dependency for getting DB sessions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
