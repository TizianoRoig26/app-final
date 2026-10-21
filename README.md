# Sistema Automatizado de Escaneo de Vulnerabilidades y Telemetría

Plataforma de auditoría, gestión y monitoreo continuo de vulnerabilidades de seguridad sobre infraestructura de red local. Desarrollado como proyecto académico de tesis basado en estándares de la industria (Nmap, OpenVAS, PostgreSQL, n8n, FastAPI y React).

---

## 1. Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada por capas:

```
[ Red / Hosts Objetivo ]
         ▲
         │ (Escaneo de red y puertos)
     [ Nmap ]
         ▲
         │ (Auditoría de vulnerabilidades con GMP)
    [ OpenVAS ]
         ▲
         │ (Orquestación y cron programado a las 02:00 AM)
      [ n8n ] ──── HTTP POST ────► [ API REST (FastAPI) ]
                                          │
                                 [ PostgreSQL / SQLite ]
                                          ▲
                                          │ TanStack Query / JSON
                                 [ Frontend (React + Vite) ]
```

### Componentes Principales

1. **Motor de Ingesta y Orquestación (n8n)**:
   - Disparo cron periódico configurable (por defecto a las 02:00 AM en franjas de menor tráfico de red).
   - Ejecución de escaneos Nmap en formatos XML estructurados.
   - Envío de tareas al demonio de OpenVAS mediante protocolo GMP.
2. **Capa de Persistencia y API (FastAPI + SQLAlchemy)**:
   - Persistencia relacional en tablas normalizadas: `vulnerability_scans` y `scan_history`.
   - Control de acceso con autenticación JWT (`pyjwt` y hashing seguro `bcrypt`).
   - Generación de informes técnicos en formato PDF con la librería `reportlab`.
   - Soporte automático para PostgreSQL en producción y SQLite en entornos locales/laboratorio.
3. **Consola de Operaciones e Interfaz Académica (React 19 + TypeScript + Tailwind CSS)**:
   - Diseño formal de grado académico e institucional (sin emojis, iconografía de contorno lineal fina y paleta neutral de alto contraste).
   - Consulta reactiva y filtrado multicriterio (por host, identificador CVE y severidad CVSS).
   - Despacho de evaluaciones bajo demanda y configuración de políticas horarias.

---

## 2. Esquema de Base de Datos

El esquema se ajusta con exactitud a la especificación relacional del proyecto:

### Tabla `vulnerability_scans`
```sql
CREATE TABLE vulnerability_scans (
    id SERIAL PRIMARY KEY,
    scan_date TIMESTAMP NOT NULL,
    host VARCHAR(255) NOT NULL,
    vulnerability_name VARCHAR(500) NOT NULL,
    severity DECIMAL(3,1) NOT NULL,
    port VARCHAR(20),
    cve VARCHAR(50),
    description TEXT,
    solution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scan_date ON vulnerability_scans(scan_date);
CREATE INDEX idx_severity ON vulnerability_scans(severity);
CREATE INDEX idx_host ON vulnerability_scans(host);
CREATE INDEX idx_cve ON vulnerability_scans(cve);
```

### Tabla `scan_history`
```sql
CREATE TABLE scan_history (
    id SERIAL PRIMARY KEY,
    scan_date TIMESTAMP NOT NULL,
    total_hosts INTEGER NOT NULL DEFAULT 0,
    total_vulnerabilities INTEGER NOT NULL DEFAULT 0,
    critical_count INTEGER NOT NULL DEFAULT 0,
    high_count INTEGER NOT NULL DEFAULT 0,
    medium_count INTEGER NOT NULL DEFAULT 0,
    low_count INTEGER NOT NULL DEFAULT 0,
    report_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Requisitos del Entorno

- **Node.js**: v18.0.0 o superior
- **Gestor de paquetes frontend**: `pnpm` (obligatorio)
- **Python**: 3.10 o superior (con virtualenv)
- **Base de Datos**: PostgreSQL 14+ (o SQLite local preconfigurado en `./scans.db`)

---

## 4. Instalación y Puesta en Marcha

### Backend (FastAPI)

1. Ingresar al directorio del backend:
   ```bash
   cd back
   ```

2. Activar el entorno virtual existente o crear uno nuevo:
   ```bash
   # En Windows PowerShell
   .\.venv\Scripts\Activate.ps1
   ```

3. Instalar dependencias si fuese necesario:
   ```bash
   pip install -r requirements.txt
   ```

4. Configurar variables de entorno (opcional; por defecto utiliza SQLite local con datos precargados si PostgreSQL no está disponible):
   ```bash
   copy .env.example .env
   ```

5. Ejecutar la suite de pruebas unitarias y de integración:
   ```bash
   pytest
   ```

6. Iniciar el servidor de desarrollo:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   La documentación interactiva OpenAPI (Swagger) estará disponible en `http://localhost:8000/docs`.

### Frontend (React + Vite)

1. Ingresar al directorio del frontend:
   ```bash
   cd front
   ```

2. Instalar dependencias con `pnpm`:
   ```bash
   pnpm install
   ```

3. Verificar tipado y calidad de código:
   ```bash
   pnpm run lint
   pnpm run build
   ```

4. Iniciar el servidor local:
   ```bash
   pnpm run dev
   ```
   El portal estará accesible en `http://localhost:5173`.

### Despliegue con Docker (Imagen Consolidada)

1. **Construir la imagen localmente**:
   ```bash
   docker build -t tiziano2612/security-scan-platform:latest .
   ```

2. **Ejecutar el contenedor de forma independiente**:
   ```bash
   docker run -d --name security_scan_app -p 8000:8000 tiziano2612/security-scan-platform:latest
   ```

3. **O ejecutar junto con PostgreSQL mediante Docker Compose**:
   ```bash
   docker compose up -d
   ```
   El portal completo estará disponible en `http://localhost:8000`.

---

## 5. Credenciales de Acceso por Defecto

Al inicializarse la base de datos por primera vez, el sistema autogenera las credenciales de operador inicial para el entorno de laboratorio:

- **Correo Electrónico**: `admin@seguridad.com`
- **Contraseña**: `admin123`
- **Rol**: Administrador de Auditoría

---

## 6. Estándares de Diseño UI/UX Aplicados

- **Web Interface Guidelines & Pro-Max**: Estructura sobria para defensas de tesis académica y auditoría corporativa.
- **Tipografía y Legibilidad**: Escala de grises Slate, contrastes superiores a 4.5:1 (WCAG AA/AAA) y tipografía monoespaciada para direcciones IP, puertos y CVEs.
- **Iconografía**: Lucide React con trazo outline de 1.5px, sin emojis ni efectos fluorescentes.
- **Rendimiento React**: Eliminación de cascadas en fetching, memoización de filtros reactivos con TanStack Query y componentes desacoplados.
