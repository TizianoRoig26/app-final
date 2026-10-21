import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.modules.auth.models import User
from app.modules.escaneo.models import VulnerabilityScan, ScanSchedule
from app.modules.auth.router import router as auth_router
from app.modules.escaneo.router import router as escaneo_router

logger = logging.getLogger(__name__)


def seed_initial_data():
    db = SessionLocal()
    try:
        # Crear usuario inicial por defecto si no existe ninguno
        admin = db.query(User).filter(User.email == "admin@seguridad.com").first()
        if not admin:
            admin = User(
                email="admin@seguridad.com",
                full_name="Administrador de Seguridad",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
            )
            db.add(admin)
            db.commit()
            logger.info("Usuario inicial creado: admin@seguridad.com / admin123")

        # Crear programación por defecto si no existe
        schedule = db.query(ScanSchedule).first()
        if not schedule:
            schedule = ScanSchedule(
                cron_time="02:00",
                target_cidr="192.168.100.0/24",
                is_enabled=True,
            )
            db.add(schedule)
            db.commit()

        # Si la tabla de escaneos está vacía, insertar datos de muestra para el panel
        if db.query(VulnerabilityScan).count() == 0:
            now = datetime.now(timezone.utc)
            sample_scans = [
                VulnerabilityScan(
                    scan_date=now,
                    host="192.168.100.10",
                    vulnerability_name="OpenSSH Remote Code Execution (RegreSSHion)",
                    severity=9.8,
                    port="22/tcp",
                    cve="CVE-2024-6387",
                    description="Posible ejecución remota de código sin autenticación en OpenSSH server.",
                    solution="Actualizar el paquete openssh-server a la versión más reciente del repositorio."
                ),
                VulnerabilityScan(
                    scan_date=now,
                    host="192.168.100.25",
                    vulnerability_name="Apache HTTP Server Path Traversal",
                    severity=7.5,
                    port="80/tcp",
                    cve="CVE-2021-41773",
                    description="Vulnerabilidad de cruce de directorio que permite acceder a archivos fuera del DocumentRoot.",
                    solution="Actualizar Apache HTTP Server a versión 2.4.51 o superior."
                ),
                VulnerabilityScan(
                    scan_date=now,
                    host="192.168.100.25",
                    vulnerability_name="Cifrados débiles TLS 1.0 / 1.1 habilitados",
                    severity=5.2,
                    port="443/tcp",
                    cve="N/A",
                    description="El servidor web permite el uso de protocolos y suites de cifrado obsoletas.",
                    solution="Deshabilitar TLS 1.0 y 1.1 en la configuración SSL/TLS y habilitar únicamente TLS 1.2 o TLS 1.3."
                ),
                VulnerabilityScan(
                    scan_date=now,
                    host="192.168.100.50",
                    vulnerability_name="ICMP Timestamp Reply Information Disclosure",
                    severity=2.1,
                    port="icmp",
                    cve="CVE-1999-0524",
                    description="El host responde a solicitudes de marca de tiempo ICMP revelando la hora del sistema.",
                    solution="Filtrar solicitudes ICMP tipo 13 en el firewall de la red."
                ),
            ]
            for s in sample_scans:
                db.add(s)
            db.commit()
    except Exception as exc:
        logger.warning(f"No se pudieron insertar datos iniciales: {exc}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        seed_initial_data()
    except Exception as exc:
        logger.warning(f"Error durante el lifespan: {exc}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configuración CORS para el frontend Vite / React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["health"])
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0"
    }


# Registrar routers modulares
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(escaneo_router, prefix=settings.API_V1_STR)

# Servir frontend compilado estático en producción (Docker) si existe la carpeta ./static
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if not os.path.exists(static_dir):
    static_dir = os.path.abspath("static")

if os.path.exists(static_dir) and os.path.isdir(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="static_assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        requested_file = os.path.join(static_dir, full_path)
        if full_path and os.path.exists(requested_file) and os.path.isfile(requested_file):
            return FileResponse(requested_file)
        return FileResponse(os.path.join(static_dir, "index.html"))

