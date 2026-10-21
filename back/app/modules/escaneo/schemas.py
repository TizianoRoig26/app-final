from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class VulnerabilityScanBase(BaseModel):
    scan_date: datetime
    host: str
    vulnerability_name: str
    severity: float
    port: Optional[str] = None
    cve: Optional[str] = None
    description: Optional[str] = None
    solution: Optional[str] = None


class VulnerabilityScanResponse(VulnerabilityScanBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ScanSummaryResponse(BaseModel):
    total: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    total_hosts: int = 0
    last_scan_date: Optional[datetime] = None


class TriggerScanRequest(BaseModel):
    target: str = Field(default="192.168.100.0/24", description="Rango CIDR o IP objetivo")
    scan_type: str = Field(default="full", description="full | quick | nmap-only")
    notes: Optional[str] = None


class TriggerScanResponse(BaseModel):
    id: int
    status: str
    target: str
    triggered_at: datetime
    message: str


class ScanScheduleUpdate(BaseModel):
    cron_time: str = Field(default="02:00", description="Hora en formato HH:MM (por defecto 02:00)")
    target_cidr: Optional[str] = "192.168.100.0/24"
    is_enabled: Optional[bool] = True


class ScanScheduleResponse(BaseModel):
    id: int
    cron_time: str
    target_cidr: str
    is_enabled: bool
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
