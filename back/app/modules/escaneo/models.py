from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, Boolean
from app.core.database import Base


class VulnerabilityScan(Base):
    __tablename__ = "vulnerability_scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_date = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    host = Column(String(100), nullable=False, index=True)
    vulnerability_name = Column(String(255), nullable=False)
    severity = Column(Numeric(3, 1), nullable=False, index=True)
    port = Column(String(20), nullable=True)
    cve = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)


class ScanSchedule(Base):
    __tablename__ = "scan_schedules"

    id = Column(Integer, primary_key=True, index=True)
    cron_time = Column(String(10), default="02:00", nullable=False)
    target_cidr = Column(String(100), default="192.168.100.0/24", nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class ScanAudit(Base):
    __tablename__ = "scan_audits"

    id = Column(Integer, primary_key=True, index=True)
    triggered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    triggered_by = Column(String(255), nullable=False)
    target = Column(String(100), nullable=False)
    scan_type = Column(String(50), default="full", nullable=False)
    status = Column(String(50), default="queued", nullable=False)
    notes = Column(Text, nullable=True)


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    scan_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    total_hosts = Column(Integer, default=0, nullable=False)
    total_vulnerabilities = Column(Integer, default=0, nullable=False)
    critical_count = Column(Integer, default=0, nullable=False)
    high_count = Column(Integer, default=0, nullable=False)
    medium_count = Column(Integer, default=0, nullable=False)
    low_count = Column(Integer, default=0, nullable=False)
    report_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

