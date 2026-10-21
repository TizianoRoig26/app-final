from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.modules.auth.models import User
from app.modules.escaneo.schemas import (
    VulnerabilityScanResponse,
    ScanSummaryResponse,
    TriggerScanRequest,
    TriggerScanResponse,
    ScanScheduleUpdate,
    ScanScheduleResponse,
)
from app.modules.escaneo.service import ScanService

router = APIRouter(prefix="/scans", tags=["scans"])


@router.get("", response_model=List[VulnerabilityScanResponse])
def list_scans(
    host: Optional[str] = Query(None, description="Filtro por host / IP"),
    min_severity: Optional[float] = Query(None, description="Filtro por severidad mínima"),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ScanService.get_scans(db, host=host, min_severity=min_severity, limit=limit, offset=offset)


@router.get("/summary", response_model=ScanSummaryResponse)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ScanService.get_summary(db)


@router.post("/trigger", response_model=TriggerScanResponse)
def trigger_scan(
    req: TriggerScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audit = ScanService.trigger_scan(db, req=req, user_email=current_user.email)
    return TriggerScanResponse(
        id=audit.id,
        status=audit.status,
        target=audit.target,
        triggered_at=audit.triggered_at,
        message="Escaneo solicitado con éxito",
    )


@router.get("/schedule", response_model=ScanScheduleResponse)
def get_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ScanService.get_or_create_schedule(db)


@router.put("/schedule", response_model=ScanScheduleResponse)
def update_schedule(
    update_in: ScanScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ScanService.update_schedule(db, update_in=update_in)


@router.get("/export/pdf")
def export_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pdf_bytes = ScanService.generate_pdf_report(db)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=reporte_vulnerabilidades.pdf"}
    )
