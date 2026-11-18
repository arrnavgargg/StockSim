import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Unified application settings loaded from environment variables and .env file."""

    PROJECT_NAME: str = "StockSim API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://stocksim_user:strong-password@localhost:5432/stocksim",
    )
    DB_ECHO: bool = False

    # Security & Auth
    SECRET_KEY: str = "temporary-super-secret-key-change-in-env-9238491823"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Virtual Trading Simulation Defaults (Indian Equities Market)
    STARTING_WALLET_BALANCE: float = 10000.00  # Starting capital
    STARTING_WALLET_CURRENCY: str = "INR"

    # Paytm Money Open API Configuration
    PAYTM_API_KEY: str = ""
    PAYTM_API_SECRET: str = ""
    PAYTM_REDIRECT_URI: str = "http://127.0.0.1:8000/callback"
    PAYTM_BASE_URL: str = "https://developer.paytmmoney.com"
    PAYTM_LOGIN_URL: str = "https://login.paytmmoney.com/merchant-login"
    PAYTM_WS_URL: str = "wss://developer-ws.paytmmoney.com/broadcast/user/v1/data"

    @property
    def is_paytm_configured(self) -> bool:
        """Returns True if Paytm Money API key and secret are configured."""
        return bool(self.PAYTM_API_KEY.strip() and self.PAYTM_API_SECRET.strip())

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


settings = Settings()
