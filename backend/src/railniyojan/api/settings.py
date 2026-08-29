from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "RailNiyojan API"
    database_url: str = (
        "postgresql+psycopg://railniyojan:railniyojan_dev@localhost:5432/railniyojan"
    )
    solver_time_budget_seconds: int = 10
    deterministic_seed: int = 26027
    ruleset_version: str = "Demo Ruleset v1"
    planner_allowlist: str = "planner-01"
    store_backend: str = "memory"
    railradar_base_url: str = "https://api.railradar.in/v1"
    railradar_api_key: str | None = None
    railradar_timeout_seconds: float = 10.0
    railradar_cache_ttl_seconds: int = 300


@lru_cache
def get_settings() -> Settings:
    return Settings()
