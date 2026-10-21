import os
# Asegurar que en modo testing se use SQLite en memoria
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base
from app.core.dependencies import get_db
from app.core.security import create_access_token, get_password_hash
from app.modules.auth.models import User
from app.modules.escaneo.models import VulnerabilityScan, ScanSchedule

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    user = User(
        email="analista@seguridad.com",
        full_name="Analista Seguridad",
        hashed_password=get_password_hash("password123"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_scans(db_session):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    scans = [
        VulnerabilityScan(
            scan_date=now,
            host="192.168.100.10",
            vulnerability_name="OpenSSH Vulnerability",
            severity=9.8,
            port="22/tcp",
            cve="CVE-2023-38408",
            description="Remote code execution in OpenSSH agent forwarding.",
            solution="Update openssh to latest version."
        ),
        VulnerabilityScan(
            scan_date=now,
            host="192.168.100.20",
            vulnerability_name="Apache HTTP Server Path Traversal",
            severity=7.5,
            port="80/tcp",
            cve="CVE-2021-41773",
            description="Path traversal flaw allowing access to arbitrary files.",
            solution="Upgrade Apache to version 2.4.51 or later."
        ),
        VulnerabilityScan(
            scan_date=now,
            host="192.168.100.20",
            vulnerability_name="SSL Weak Cipher Suites",
            severity=5.0,
            port="443/tcp",
            cve="N/A",
            description="Weak ciphers enabled on web server.",
            solution="Disable RC4 and 3DES in web server configuration."
        ),
        VulnerabilityScan(
            scan_date=now,
            host="192.168.100.30",
            vulnerability_name="ICMP Timestamp Reply Information Disclosure",
            severity=2.1,
            port="icmp",
            cve="CVE-1999-0524",
            description="The remote host answers to ICMP timestamp requests.",
            solution="Filter out ICMP timestamp requests at firewall."
        )
    ]
    for scan in scans:
        db_session.add(scan)
    db_session.commit()
    return scans
