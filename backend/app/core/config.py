"""Configuration module for loading settings from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings using pydantic-settings."""

    APP_NAME: str = "AI-Based Micro-Business Cashflow Management System"
    VERSION: str = "0.1.0"
    DEBUG: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
