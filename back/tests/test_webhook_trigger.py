"""
Tests del disparador Webhook de n8n — SIN TRÁFICO REAL.

Estrategia de mock:
  - Se usa pytest-httpx (httpx_mock fixture) para interceptar TODAS las llamadas
    salientes de httpx.Client, incluyendo las del ScanService.
  - El Webhook real (N8N_WEBHOOK_URL) NUNCA recibe tráfico: cada test configura
    respuestas simuladas que sustituyen al servidor n8n.
  - Se desactiva la ruta REST API de n8n (N8N_WORKFLOW_ID="") para que el servicio
    pase directamente al camino del Webhook en todos los escenarios.

Escenarios cubiertos:
  1. Webhook responde 200 OK        → status "dispatched", payload/headers correctos
  2. Webhook responde 401           → status "queued", nota de error registrada
  3. Webhook responde 500           → status "queued", nota de error registrada
  4. Webhook lanza TimeoutException → status "queued", nota de timeout registrada
  5. Sin credencial webhookHeaderAuth → petición enviada sin X-N8N-API-KEY
"""

import json
import pytest
import httpx
from pytest_httpx import HTTPXMock

# ---------------------------------------------------------------------------
# Fixtures de entorno
# ---------------------------------------------------------------------------

MOCK_WEBHOOK_URL = "http://mock-n8n.local/webhook/trigger-scan"
MOCK_WEBHOOK_SECRET = "test-webhook-secret-abc123"


@pytest.fixture(autouse=True)
def patch_n8n_settings(monkeypatch):
    """
    Configura settings para que el servicio use SOLO el Webhook mock.
    - N8N_WORKFLOW_ID="" → omite la ruta REST API de n8n
    - N8N_WEBHOOK_URL   → apunta al servidor simulado (nunca al real)
    - N8N_WEBHOOK_SECRET → valor de header conocido para aserción
    """
    import os
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.setenv("N8N_BASE_URL", "http://mock-n8n.local")
    monkeypatch.setenv("N8N_WORKFLOW_ID", "")                    # deshabilitar REST API path
    monkeypatch.setenv("N8N_WEBHOOK_URL", MOCK_WEBHOOK_URL)
    monkeypatch.setenv("N8N_WEBHOOK_SECRET", MOCK_WEBHOOK_SECRET)
    monkeypatch.setenv("N8N_API_KEY", "")

    # Re-inicializar settings con los nuevos valores de entorno
    from app.core import config as cfg_module
    from app.core.config import Settings
    new_settings = Settings()
    monkeypatch.setattr(cfg_module, "settings", new_settings)

    # Propagar al módulo de servicio que ya importó settings
    from app.modules.escaneo import service as svc_module
    monkeypatch.setattr(svc_module, "settings", new_settings)


# ---------------------------------------------------------------------------
# Helper: ejecutar trigger_scan con DB in-memory
# ---------------------------------------------------------------------------

def _run_trigger(db_session, target="172.18.0.200", scan_type="full", notes="test"):
    from app.modules.escaneo.service import ScanService
    from app.modules.escaneo.schemas import TriggerScanRequest

    req = TriggerScanRequest(target=target, scan_type=scan_type, notes=notes)
    return ScanService.trigger_scan(db_session, req=req, user_email="analista@test.com")


# ===========================================================================
# TEST 1 — Webhook 200 OK: status dispatched, payload y header correctos
# ===========================================================================

def test_webhook_200_dispatches_correctly(db_session, httpx_mock: HTTPXMock):
    """
    DADO que n8n responde 200,
    CUANDO el servicio dispara el Webhook,
    ENTONCES el audit queda en 'dispatched' y se envió el payload/header correcto.
    """
    httpx_mock.add_response(
        method="POST",
        url=MOCK_WEBHOOK_URL,
        status_code=200,
        json={"message": "Workflow started"},
    )

    audit = _run_trigger(db_session)

    # Verificar estado persistido
    assert audit.status == "dispatched"
    assert "Webhook OK" in (audit.notes or "")

    # Verificar exactitud de la petición enviada
    requests_made = httpx_mock.get_requests()
    assert len(requests_made) == 1, "Solo debe haberse hecho UNA petición HTTP"

    req = requests_made[0]
    assert req.method == "POST"
    assert str(req.url) == MOCK_WEBHOOK_URL

    # Verificar header de autenticación
    assert req.headers.get("x-n8n-api-key") == MOCK_WEBHOOK_SECRET, (
        f"Header X-N8N-API-KEY incorrecto: {req.headers.get('x-n8n-api-key')}"
    )

    # Verificar estructura del body
    body = json.loads(req.content)
    assert body["target"] == "172.18.0.200"
    assert body["scan_type"] == "full"
    assert body["triggered_by"] == "analista@test.com"
    assert "timestamp" in body
    assert "workflow_id" in body


# ===========================================================================
# TEST 2 — Webhook 401 Unauthorized: status queued, error anotado
# ===========================================================================

def test_webhook_401_falls_back_to_queued(db_session, httpx_mock: HTTPXMock):
    """
    DADO que n8n responde 401 (header de auth incorrecto),
    CUANDO el servicio intenta disparar el Webhook,
    ENTONCES el audit queda en 'queued' con la nota del código de error.
    """
    httpx_mock.add_response(
        method="POST",
        url=MOCK_WEBHOOK_URL,
        status_code=401,
        json={"message": "Unauthorized"},
    )

    audit = _run_trigger(db_session)

    assert audit.status == "queued"
    assert "401" in (audit.notes or "")

    requests_made = httpx_mock.get_requests()
    assert len(requests_made) == 1


# ===========================================================================
# TEST 3 — Webhook 500 Internal Server Error: status queued, error anotado
# ===========================================================================

def test_webhook_500_falls_back_to_queued(db_session, httpx_mock: HTTPXMock):
    """
    DADO que n8n responde 500,
    CUANDO el servicio dispara el Webhook,
    ENTONCES el audit queda en 'queued' con la nota del código de error.
    """
    httpx_mock.add_response(
        method="POST",
        url=MOCK_WEBHOOK_URL,
        status_code=500,
        json={"error": "Internal Server Error"},
    )

    audit = _run_trigger(db_session)

    assert audit.status == "queued"
    assert "500" in (audit.notes or "")


# ===========================================================================
# TEST 4 — Timeout: status queued, timeout anotado
# ===========================================================================

def test_webhook_timeout_falls_back_to_queued(db_session, httpx_mock: HTTPXMock):
    """
    DADO que n8n no responde en el tiempo límite (timeout),
    CUANDO el servicio dispara el Webhook,
    ENTONCES el audit queda en 'queued' con nota de timeout.
    """
    httpx_mock.add_exception(
        httpx.TimeoutException("Connection timed out"),
        url=MOCK_WEBHOOK_URL,
    )

    audit = _run_trigger(db_session)

    assert audit.status == "queued"
    assert "timeout" in (audit.notes or "").lower()


# ===========================================================================
# TEST 5 — Sin secret: petición enviada sin header X-N8N-API-KEY
# ===========================================================================

def test_webhook_without_secret_sends_no_auth_header(db_session, httpx_mock: HTTPXMock, monkeypatch):
    """
    DADO que N8N_WEBHOOK_SECRET está vacío,
    CUANDO el servicio dispara el Webhook,
    ENTONCES la petición NO incluye el header X-N8N-API-KEY.
    """
    # Sobrescribir solo el secret a vacío
    from app.core import config as cfg_module
    from app.core.config import Settings
    import os
    monkeypatch.setenv("N8N_WEBHOOK_SECRET", "")
    new_settings = Settings()
    monkeypatch.setattr(cfg_module, "settings", new_settings)
    from app.modules.escaneo import service as svc_module
    monkeypatch.setattr(svc_module, "settings", new_settings)

    httpx_mock.add_response(
        method="POST",
        url=MOCK_WEBHOOK_URL,
        status_code=200,
        json={"message": "ok"},
    )

    _run_trigger(db_session)

    req = httpx_mock.get_requests()[0]
    assert req.headers.get("x-n8n-api-key") is None, (
        "No debe enviarse el header X-N8N-API-KEY cuando el secret está vacío"
    )


# ===========================================================================
# TEST 6 — Payload completo: todas las claves requeridas presentes
# ===========================================================================

def test_webhook_payload_contains_all_required_keys(db_session, httpx_mock: HTTPXMock):
    """
    Verifica que el body del Webhook incluye exactamente las claves que el
    workflow de n8n necesita: target, scan_type, triggered_by, workflow_id, timestamp.
    """
    httpx_mock.add_response(
        method="POST",
        url=MOCK_WEBHOOK_URL,
        status_code=200,
        json={"message": "ok"},
    )

    _run_trigger(db_session, target="10.0.0.5", scan_type="quick", notes="audit check")

    req = httpx_mock.get_requests()[0]
    body = json.loads(req.content)

    required_keys = {"target", "scan_type", "triggered_by", "workflow_id", "timestamp"}
    missing = required_keys - body.keys()
    assert not missing, f"Faltan claves en el payload del Webhook: {missing}"

    assert body["target"] == "10.0.0.5"
    assert body["scan_type"] == "quick"
