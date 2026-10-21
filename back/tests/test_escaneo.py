def test_list_scans_empty(client, auth_headers):
    response = client.get("/api/v1/scans", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_list_scans_with_data(client, auth_headers, sample_scans):
    response = client.get("/api/v1/scans", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    assert any(s["vulnerability_name"] == "OpenSSH Vulnerability" for s in data)


def test_list_scans_filtered_by_severity(client, auth_headers, sample_scans):
    response = client.get("/api/v1/scans?min_severity=7.0", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(s["severity"] >= 7.0 for s in data)


def test_list_scans_filtered_by_host(client, auth_headers, sample_scans):
    response = client.get("/api/v1/scans?host=192.168.100.20", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(s["host"] == "192.168.100.20" for s in data)


def test_get_scan_summary(client, auth_headers, sample_scans):
    response = client.get("/api/v1/scans/summary", headers=auth_headers)
    assert response.status_code == 200
    summary = response.json()
    assert summary["total"] == 4
    assert summary["critical"] == 1  # 9.8
    assert summary["high"] == 1      # 7.5
    assert summary["medium"] == 1    # 5.0
    assert summary["low"] == 1       # 2.1
    assert summary["total_hosts"] == 3


def test_trigger_manual_scan(client, auth_headers):
    payload = {
        "target": "192.168.100.0/24",
        "scan_type": "full",
        "notes": "Escaneo manual de prueba"
    }
    response = client.post("/api/v1/scans/trigger", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["queued", "dispatched", "success"]
    assert data["target"] == "192.168.100.0/24"


def test_get_and_update_schedule(client, auth_headers):
    # Obtener schedule default
    get_res = client.get("/api/v1/scans/schedule", headers=auth_headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["cron_time"] == "02:00"

    # Actualizar schedule a las 04:00 AM
    update_res = client.put(
        "/api/v1/scans/schedule",
        json={"cron_time": "04:00", "target_cidr": "10.0.0.0/24", "is_enabled": True},
        headers=auth_headers
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["cron_time"] == "04:00"
    assert updated["target_cidr"] == "10.0.0.0/24"


def test_export_pdf_report(client, auth_headers, sample_scans):
    response = client.get("/api/v1/scans/export/pdf", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
