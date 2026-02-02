
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    # Database
    DATABASE_URL: Optional[str] = None

    # Snowflake Configuration
    SNOWFLAKE_ACCOUNT: Optional[str] = None
    SNOWFLAKE_USER: Optional[str] = None
    SNOWFLAKE_PASSWORD: Optional[str] = None
    SNOWFLAKE_WAREHOUSE: str = "COMPUTE_WH"
    SNOWFLAKE_DATABASE: str = "NeuroKid_DW"
    SNOWFLAKE_SCHEMA: str = "PUBLIC"

    # Integration Settings
    DRIFT_THRESHOLD_PERCENT: float = 0.20  # 20% deviation triggers alert

    # Logging
    LOG_LEVEL: str = "INFO"

settings = Settings()

