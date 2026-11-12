import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Vulnerability Scanning Platform TASTSERV"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_jwt_key_scanning_platform_2026_dev")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Base de datos PostgreSQL (con fallback a SQLite para desarrollo/testing)
    # Credenciales alineadas con Final/infra/n8n/docker-compose.yml:
    #   DB: security_scans | Usuario: n8n_user | Puerto host: 5433
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://n8n_user:secure_password@localhost:5433/security_scans"
    )

    # Integración con n8n
    N8N_BASE_URL: str = os.getenv("N8N_BASE_URL", "http://localhost:5678")
    N8N_API_KEY: str = os.getenv("N8N_API_KEY", "")
    # ID fijo del workflow actual-20261105.json
    N8N_WORKFLOW_ID: str = os.getenv("N8N_WORKFLOW_ID", "eZcFfWr0YiA2pAE3")
    N8N_WEBHOOK_URL: str = os.getenv(
        "N8N_WEBHOOK_URL",
        "http://localhost:5678/webhook/trigger-scan"
    )
    # Valor del header de autenticación del nodo Webhook (credencial webhookHeaderAuth01)
    N8N_WEBHOOK_SECRET: str = os.getenv("N8N_WEBHOOK_SECRET", "")

    # Configuración de escaneo para laboratorio TASTSERV
    DEFAULT_SCAN_CRON: str = "02:00"
    DEFAULT_SCAN_CIDR: str = "172.18.0.200 172.18.0.201 172.18.0.202"

    # CORS
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")


settings = Settings()
