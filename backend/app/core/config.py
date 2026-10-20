from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación, leída de variables de entorno o de `.env`."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "FlowTask API"
    database_url: str = "sqlite:///./flowtask.db"
    cors_origins: list[str] = ["http://localhost:4200", "http://localhost:8080"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
