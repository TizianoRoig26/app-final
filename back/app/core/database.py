import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

target_url = settings.DATABASE_URL
connect_args = {}

# Verificar si PostgreSQL está disponible o si debemos recurrir a SQLite local
if target_url.startswith("postgresql"):
    try:
        test_engine = create_engine(target_url, connect_args={"connect_timeout": 2})
        with test_engine.connect() as conn:
            pass
        logger.info("Conectado exitosamente a PostgreSQL")
    except Exception:
        logger.warning(
            "PostgreSQL no está activo en %s. Utilizando base local SQLite (./scans.db) para desarrollo.",
            target_url
        )
        target_url = "sqlite:///./scans.db"
        connect_args = {"check_same_thread": False}
elif target_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    target_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
