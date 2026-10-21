def test_register_user_success(client):
    payload = {
        "email": "nuevo@analista.com",
        "password": "Password123!",
        "full_name": "Nuevo Analista"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "nuevo@analista.com"
    assert data["full_name"] == "Nuevo Analista"
    assert "id" in data
    assert "password" not in data


def test_register_user_duplicate_email(client, test_user):
    payload = {
        "email": test_user.email,
        "password": "OtherPassword123",
        "full_name": "Duplicado"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "registrado" in response.json()["detail"].lower() or "already" in response.json()["detail"].lower()


def test_login_success(client, test_user):
    payload = {
        "email": test_user.email,
        "password": "password123"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_user.email


def test_login_invalid_password(client, test_user):
    payload = {
        "email": test_user.email,
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


def test_get_current_user_me(client, auth_headers, test_user):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name


def test_get_current_user_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
