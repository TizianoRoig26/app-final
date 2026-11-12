# TASTSERV — Guía de Despliegue Conjunto

Plataforma de gestión y visualización de escaneos de vulnerabilidades.  
Repositorios involucrados: **`app-final`** (Frontend + Backend) y **`Final`** (Infraestructura n8n + PostgreSQL).

---

## Arquitectura General

```
┌─────────────────────────────────┐    ┌────────────────────────────────────┐
│          app-final              │    │              Final                  │
│                                 │    │                                    │
│  Frontend React (Vite)  :5173   │    │  n8n :5678                         │
│  Backend FastAPI        :8000   │◄───┤  PostgreSQL :5433 (host)           │
│                                 │    │  Greenbone/OpenVAS                 │
└─────────────────────────────────┘    └────────────────────────────────────┘
         │  POST /webhook/trigger-scan ──────────────────────► n8n
         │  SELECT vulnerability_scans ──────────────────────► PostgreSQL
```

---

## Requisitos Previos

- Docker Desktop ≥ 24 y Docker Compose v2
- Node.js ≥ 20 + pnpm (solo para desarrollo del frontend)
- Python ≥ 3.11 (solo para desarrollo del backend)
- Ambos repositorios clonados en el mismo directorio padre:

```
├── Final/           ← infra/n8n, workflows, db/
└── app-final/       ← back/, front/, docker-compose.yml
```

---

## Paso 1 — Levantar la Infraestructura (`Final`)

```bash
cd Final/infra/n8n

# 1. Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env: configurar contraseñas de Postgres, GMP, SMTP

# 2. Crear la red externa requerida por Greenbone (si no existe)
docker network create greenbone-community-edition_default

# 3. Levantar PostgreSQL + n8n
docker compose up -d

# 4. Verificar que los servicios estén sanos
docker compose ps
```

> **Nota de puertos:** PostgreSQL queda expuesto en el **puerto 5433** del host (para evitar conflictos con instancias locales). n8n en el **5678**.

### Importar el Workflow en n8n

1. Abrir `http://localhost:5678` en el navegador
2. Crear cuenta de administrador (primera vez)
3. Ir a **Workflows → Import from File**
4. Seleccionar `Final/workflows/actual-20261105.json`
5. Configurar las credenciales del workflow:
   - **SSH Host Scanner** (`sshPrivateKey`): clave privada SSH hacia el host que ejecuta Nmap/OpenVAS
   - **Postgres account** (`postgres`): `security_scans` / `n8n_user` / `<contraseña del .env>`
   - **Webhook Scan Header Auth** (`httpHeaderAuth`): nombre del header + secret a elegir  
     _(el valor del secret debe ir en `N8N_WEBHOOK_SECRET` del backend)_
   - **SMTP account** (`smtp`): credenciales de Mailtrap u otro proveedor
6. Activar el workflow (toggle en la esquina superior derecha)

---

## Paso 2 — Levantar la Aplicación (`app-final`)

```bash
cd app-final

# 1. Copiar y configurar variables de entorno del backend
cp back/.env.example back/.env
```

Editar `back/.env` con los valores reales:

```dotenv
# Base de datos — coincidir con Final/infra/n8n/.env
DATABASE_URL="postgresql://n8n_user:<TU_CONTRASEÑA>@localhost:5433/security_scans"

# n8n
N8N_BASE_URL="http://localhost:5678"
N8N_WEBHOOK_URL="http://localhost:5678/webhook/trigger-scan"
N8N_WORKFLOW_ID="eZcFfWr0YiA2pAE3"
N8N_WEBHOOK_SECRET="<valor configurado en la credencial webhookHeaderAuth01 de n8n>"
N8N_API_KEY=""          # opcional: API key de n8n para ruta REST

SECRET_KEY="<mínimo 32 caracteres aleatorios>"
```

```bash
# 2. Levantar con Docker Compose
#    El frontend compilado se sirve desde el backend (FastAPI StaticFiles)
docker compose up -d --build

# 3. Verificar
curl http://localhost:8000/health
# → {"status":"ok","service":"Vulnerability Scanning Platform TASTSERV","version":"1.0.0"}
```

Acceder a la plataforma: **http://localhost:8000**  
Credenciales por defecto (cambiar en producción): `admin@seguridad.com` / `admin123`

---

## Paso 3 — Despliegue con Redes Docker Compartidas

Si `app-final` y `Final` se despliegan en el **mismo host Docker**, se puede conectar `app-final` a la red de `Final` para acceso interno:

```yaml
# En app-final/docker-compose.yml, agregar a los servicios:
services:
  web:
    networks:
      - app_net
      - greenbone_net   # red de Final
  db:
    networks:
      - app_net

networks:
  app_net:
  greenbone_net:
    external: true
    name: greenbone-community-edition_default
```

Y actualizar las URLs en `.env`:
```dotenv
DATABASE_URL="postgresql://n8n_user:<pass>@security_db:5432/security_scans"
N8N_WEBHOOK_URL="http://n8n:5678/webhook/trigger-scan"
```

---

## Desarrollo Local (sin Docker)

### Backend

```bash
cd app-final/back
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
cp .env.example .env          # configurar DATABASE_URL y vars de n8n

# Si no hay Postgres disponible, el backend cae automáticamente a SQLite
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd app-final/front
pnpm install
cp .env.example .env.local    # VITE_API_URL=http://localhost:8000/api/v1
pnpm dev                       # → http://localhost:5173
```

El proxy de Vite (`/api → localhost:8000`) maneja CORS en desarrollo automáticamente.

---

## Ejecución de Tests

```bash
cd app-final/back

# Suite completa (22 tests)
python -m pytest tests/ -v

# Solo tests del Webhook mockeado (sin tráfico a n8n real)
python -m pytest tests/test_webhook_trigger.py -v

# Solo integración de BD y endpoints
python -m pytest tests/test_escaneo.py tests/test_auth.py tests/test_health.py -v
```

> **RESTRICCIÓN:** Ningún test envía tráfico al Webhook real de n8n. Los tests del Webhook usan `pytest-httpx` para interceptar todas las llamadas salientes de `httpx`.

### Build del Frontend

```bash
cd app-final/front
pnpm run build    # tsc + vite build → dist/
```

---

## Variables de Entorno — Referencia Completa

### Backend (`back/.env`)

| Variable | Requerida | Descripción | Ejemplo |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Cadena de conexión PostgreSQL | `postgresql://n8n_user:pass@localhost:5433/security_scans` |
| `SECRET_KEY` | ✅ | Clave JWT (≥32 chars en prod) | `cambiar-en-produccion-32chars` |
| `N8N_BASE_URL` | ✅ | URL base de n8n (sin `/`) | `http://localhost:5678` |
| `N8N_WEBHOOK_URL` | ✅ | URL completa del Webhook | `http://localhost:5678/webhook/trigger-scan` |
| `N8N_WORKFLOW_ID` | ✅ | ID del workflow importado | `eZcFfWr0YiA2pAE3` |
| `N8N_WEBHOOK_SECRET` | ✅ | Valor del header de auth | `mi-secret-webhook` |
| `N8N_API_KEY` | ⬜ | API key REST de n8n (opcional) | — |
| `CORS_ORIGINS` | ⬜ | Orígenes CORS (prod: lista explícita) | `https://mi-dominio.com` |
| `DEFAULT_SCAN_CRON` | ⬜ | Hora del cron (solo referencia UI) | `02:00` |
| `DEFAULT_SCAN_CIDR` | ⬜ | Target por defecto para disparos UI | `172.18.0.200 172.18.0.201 172.18.0.202` |

### Frontend (`front/.env.local`)

| Variable | Descripción | Valor dev | Valor prod |
|---|---|---|---|
| `VITE_API_URL` | Base URL del API (solo si no hay proxy Vite) | `http://localhost:8000/api/v1` | `/api/v1` |

---

## Disparador Manual — Flujo de UI

1. Click en **"Iniciar Procedimiento"** (botón Navbar o Dashboard)
2. Seleccionar objetivo (chips rápidos de laboratorio o input manual)
3. Elegir tipo de evaluación: `full` / `quick` / `nmap-only`
4. Agregar notas de auditoría (opcional)
5. Click **"Iniciar Procedimiento"**
   - El backend intenta: REST API de n8n → Webhook → modo `queued`
   - El Webhook incluye `X-N8N-API-KEY: <N8N_WEBHOOK_SECRET>` en el header
   - La respuesta de n8n es inmediata (200, `responseMode: onReceived`)
6. Feedback visual: spinner durante la petición, badge verde (dispatched) o gris (queued), modal se cierra automáticamente en 1.6s

---

## Notas de Seguridad para Producción

- Cambiar `SECRET_KEY` por un valor aleatorio fuerte (`openssl rand -hex 32`)
- Reemplazar el usuario `admin@seguridad.com` / `admin123` inmediatamente después del primer login
- Configurar `CORS_ORIGINS` con dominios explícitos (no `*`)
- Usar HTTPS con un reverse proxy (Nginx/Caddy/Traefik) delante del backend
- El `N8N_WEBHOOK_SECRET` debe ser un valor largo y aleatorio, configurado también en la credencial `webhookHeaderAuth01` de n8n
