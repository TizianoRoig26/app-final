import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Vulnerability Scanning Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_jwt_key_scanning_platform_2026_dev")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Base de datos PostgreSQL (con fallback a SQLite para desarrollo/testing)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/vulnerabilities"
    )

    # Integración con n8n
    N8N_BASE_URL: str = os.getenv("N8N_BASE_URL", "http://localhost:5678")
    N8N_API_KEY: str = os.getenv("N8N_API_KEY", "")
    N8N_WORKFLOW_ID: str = os.getenv("N8N_WORKFLOW_ID", "eZcFfWr0YiA2pAE3")
    N8N_WEBHOOK_URL: str = os.getenv(
        "N8N_WEBHOOK_URL",
        "http://localhost:5678/webhook/trigger-scan"
    )

    # Configuración de escaneo para laboratorio TASTSERV
    DEFAULT_SCAN_CRON: str = "02:00"
    DEFAULT_SCAN_CIDR: str = "172.18.0.200 172.18.0.201 172.18.0.202"

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")



settings = Settings()
