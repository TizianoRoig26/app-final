import io
from datetime import datetime, timezone
from typing import List, Optional
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import func

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.core.config import settings
from app.modules.escaneo.models import VulnerabilityScan, ScanSchedule, ScanAudit
from app.modules.escaneo.schemas import TriggerScanRequest, ScanScheduleUpdate


class ScanService:
    @staticmethod
    def get_scans(
        db: Session,
        host: Optional[str] = None,
        min_severity: Optional[float] = None,
        limit: int = 200,
        offset: int = 0
    ) -> List[VulnerabilityScan]:
        query = db.query(VulnerabilityScan)
        if host:
            query = query.filter(VulnerabilityScan.host.ilike(f"%{host}%"))
        if min_severity is not None:
            query = query.filter(VulnerabilityScan.severity >= min_severity)
        return query.order_by(VulnerabilityScan.severity.desc(), VulnerabilityScan.scan_date.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_summary(db: Session) -> dict:
        scans = db.query(VulnerabilityScan).all()
        total = len(scans)
        critical = 0
        high = 0
        medium = 0
        low = 0
        hosts = set()
        last_date = None

        for s in scans:
            sev = float(s.severity) if s.severity is not None else 0.0
            if sev >= 9.0:
                critical += 1
            elif sev >= 7.0:
                high += 1
            elif sev >= 4.0:
                medium += 1
            else:
                low += 1

            if s.host:
                hosts.add(s.host)
            if s.scan_date:
                if last_date is None or s.scan_date > last_date:
                    last_date = s.scan_date

        return {
            "total": total,
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
            "total_hosts": len(hosts),
            "last_scan_date": last_date
        }

    @staticmethod
    def trigger_scan(db: Session, req: TriggerScanRequest, user_email: str) -> ScanAudit:
        status_result = "queued"
        notes_detail = req.notes or ""

        # Intento de comunicación con el Webhook de n8n
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.post(
                    settings.N8N_WEBHOOK_URL,
                    json={
                        "target": req.target,
                        "scan_type": req.scan_type,
                        "triggered_by": user_email,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                )
                if res.status_code in [200, 201, 202]:
                    status_result = "dispatched"
        except Exception:
            # Si n8n no está disponible en este instante, el escaneo queda encolado
            status_result = "queued"

        audit = ScanAudit(
            triggered_at=datetime.now(timezone.utc),
            triggered_by=user_email,
            target=req.target,
            scan_type=req.scan_type,
            status=status_result,
            notes=notes_detail
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit

    @staticmethod
    def get_or_create_schedule(db: Session) -> ScanSchedule:
        schedule = db.query(ScanSchedule).first()
        if not schedule:
            schedule = ScanSchedule(
                cron_time=settings.DEFAULT_SCAN_CRON,
                target_cidr=settings.DEFAULT_SCAN_CIDR,
                is_enabled=True
            )
            db.add(schedule)
            db.commit()
            db.refresh(schedule)
        return schedule

    @staticmethod
    def update_schedule(db: Session, update_in: ScanScheduleUpdate) -> ScanSchedule:
        schedule = ScanService.get_or_create_schedule(db)
        schedule.cron_time = update_in.cron_time
        if update_in.target_cidr is not None:
            schedule.target_cidr = update_in.target_cidr
        if update_in.is_enabled is not None:
            schedule.is_enabled = update_in.is_enabled
        schedule.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(schedule)
        return schedule

    @staticmethod
    def generate_pdf_report(db: Session) -> bytes:
        summary = ScanService.get_summary(db)
        scans = ScanService.get_scans(db, limit=100)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            name="TitleStyle",
            parent=styles["Heading1"],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a")
        )
        subtitle_style = ParagraphStyle(
            name="SubtitleStyle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748b")
        )
        heading2_style = ParagraphStyle(
            name="Heading2Style",
            parent=styles["Heading2"],
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#1e293b")
        )
        cell_style = ParagraphStyle(
            name="CellStyle",
            parent=styles["Normal"],
            fontSize=8,
            leading=10
        )

        elements = []

        elements.append(Paragraph("Informe Ejecutivo de Seguridad y Vulnerabilidades", title_style))
        elements.append(Spacer(1, 4))
        date_str = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")
        elements.append(Paragraph(f"Generado automáticamente: {date_str} | Plataforma de Automatización", subtitle_style))
        elements.append(Spacer(1, 16))

        # Tabla de resumen
        summary_data = [
            ["Métrica", "Valor", "Severidad", "Cantidad"],
            ["Total de Vulnerabilidades", str(summary["total"]), "Crítica (>= 9.0)", str(summary["critical"])],
            ["Hosts Analizados", str(summary["total_hosts"]), "Alta (7.0 - 8.9)", str(summary["high"])],
            ["Hora Programada Estándar", "02:00 AM", "Media (4.0 - 6.9)", str(summary["medium"])],
            ["Último Escaneo", str(summary["last_scan_date"])[:19] if summary["last_scan_date"] else "N/A", "Baja (0.0 - 3.9)", str(summary["low"])],
        ]

        summary_table = Table(summary_data, colWidths=[160, 90, 160, 90])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 18))

        elements.append(Paragraph("Detalle de Hallazgos Recientes", heading2_style))
        elements.append(Spacer(1, 8))

        findings_data = [["Host", "Puerto", "Severidad", "Vulnerabilidad", "CVE"]]
        for scan in scans:
            findings_data.append([
                Paragraph(str(scan.host), cell_style),
                Paragraph(str(scan.port or "-"), cell_style),
                Paragraph(str(scan.severity), cell_style),
                Paragraph(str(scan.vulnerability_name)[:60], cell_style),
                Paragraph(str(scan.cve or "N/A"), cell_style),
            ])

        if len(findings_data) == 1:
            findings_data.append([Paragraph("Sin hallazgos registrados", cell_style), "", "", "", ""])

        findings_table = Table(findings_data, colWidths=[90, 50, 50, 240, 70])
        findings_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(findings_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
