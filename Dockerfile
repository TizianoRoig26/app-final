# Multi-stage Dockerfile for complete Vulnerability Scanning Platform

# -------------------------------------------------------------
# Stage 1: Build Frontend (Vite + React + Tailwind CSS)
# -------------------------------------------------------------
FROM node:22-alpine AS frontend-builder
WORKDIR /app/front

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY front/package.json front/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY front/ ./
RUN pnpm run build

# -------------------------------------------------------------
# Stage 2: Final Production Image (FastAPI Backend + Built Frontend)
# -------------------------------------------------------------
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Dependencias mínimas del sistema si se requieren
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY back/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del backend
COPY back/app ./app

# Copiar artefactos estáticos compilados del frontend
COPY --from=frontend-builder /app/front/dist ./static

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
