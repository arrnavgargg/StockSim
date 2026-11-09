from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "StockSim"
    SECRET_KEY: str = "temporary-super-secret-key-change-in-env-9238491823"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    class Config:
        case_sensitive = True

settings = Settings()
