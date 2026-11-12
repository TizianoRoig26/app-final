# 📦 ENTREGA FINAL — Correcciones a Observaciones de la Tesis TASTSERV

> Carpeta autónoma, completa y consolidada con todo el material probatorio, código de infraestructura, workflow, script GMP y planillas de medición requeridas para responder a las observaciones N3, N9, N10 y N13 de la revisión de la tesis.

---

## 🗂️ Estructura Completa de la Carpeta

```
entrega_final/
│
├── README.md                          ← Este archivo (índice general y guía de entrega)
├── CORRECCIONES_OBSERVACIONES_TESIS.md ← Texto listo para copiar y pegar en la tesis
│
├── Anexo_I_Infraestructura/           ← Código completo de Infraestructura como Código (IaC)
│   ├── docker-compose-openvas.yml     ← Suite Greenbone Community Edition (20+ servicios)
│   ├── docker-compose-vulnsrv.yml     ← 3 servidores vulnerables con direccionamiento estático
│   ├── docker-compose-n8n.yml         ← Orquestador n8n
│   ├── ddl_vulnerability_scans.sql    ← DDL de PostgreSQL (tabla de persistencia estructurada)
│   ├── vulnsrv_srv1/                  ← vuln-srv1: vsftpd 3.0.3 + OpenSSH 7.9p1 (Debian Buster)
│   │   ├── Dockerfile
│   │   ├── entrypoint.sh
│   │   └── vsftpd.conf
│   ├── vulnsrv_srv2/                  ← vuln-srv2: Apache 2.4.49 (CVE-2021-41773) + OpenSSH (Debian)
│   │   ├── Dockerfile
│   │   └── entrypoint.sh
│   └── vulnsrv_srv3/                  ← vuln-srv3: Apache 2.4.41 + vsftpd + OpenSSH (Ubuntu 20.04)
│       ├── Dockerfile                 ← Configuración explícita de Directory Listing
│       ├── entrypoint.sh
│       └── vsftpd.conf
│
├── Anexo_II_Workflow/                 ← Workflow de orquestación en n8n
│   └── workflow_tastserv.json         ← Exportación íntegra del pipeline (nodos, conexiones y lógica)
│
├── Anexo_III_Planilla_Tiempos/        ← Instrumento de medición según §3.5.1
│   └── planilla_tiempos_ejecucion.md  ← 10 corridas experimentales (5 manuales + 5 automatizadas)
│                                         con desglose por etapas y análisis estadístico (-63.16%)
│
├── Anexo_IV_Planilla_Deteccion/       ← Instrumento de medición según §3.5.2
│   └── planilla_efectividad_deteccion.md ← Ground Truth con 32 vulnerabilidades, rúbrica (0/1/2),
│                                         matriz de las 10 corridas y análisis de cobertura (90.6%)
│
├── Anexo_V_Script_GMP/               ← Script de automatización OpenVAS/GMP
│   └── automated_scan.gmp.py         ← Script Python (gvm-tools) para creación dinámica de Port List y Target
│
└── Evidencia_Resultados/             ← Reporte experimental consolidado
    └── resultados_pruebas.md          ← Análisis exhaustivo por caso de estudio y métricas globales
```

---

## 🎯 Observaciones Resueltas y Ubicación del Material

| Observación | Problema Identificado | Dónde se Resuelve en esta Carpeta |
|:---:|---|---|
| **N3** | Anexos I y II prometidos en §3.5.3 pero inexistentes; repositorio sin URL en §3.7. | • `CORRECCIONES_OBSERVACIONES_TESIS.md` (§3a, §3b, §3c)<br>• `Anexo_I_Infraestructura/`<br>• `Anexo_II_Workflow/workflow_tastserv.json`<br>• `Anexo_III_Planilla_Tiempos/`<br>• `Anexo_IV_Planilla_Deteccion/` |
| **N9** | Placeholder de red `[IP A COMPLETAR]` en Figura 2; falta de justificación técnica de Docker vs. VMs; relación con IPs 172.18.0.200–202. | • `CORRECCIONES_OBSERVACIONES_TESIS.md` (§9a, §9b, §9c, §9d)<br>• Mapeo detallado de servidores y servicios en §9d |
| **N10** | Contradicción entre "red sin conexión a internet" (§3.7) y notificación por correo SMTP a Mailtrap (§4.1). | • `CORRECCIONES_OBSERVACIONES_TESIS.md` (§10a, §10b)<br>• Aclaración explícita del aislamiento del laboratorio con excepción outbound hacia Mailtrap |
| **N13** | Procedimiento manual no descrito paso a paso (herramientas, configuración de escaneo, tabulación). | • `CORRECCIONES_OBSERVACIONES_TESIS.md` (§13a)<br>• Secuencia metodológica paso a paso desde CLI con `gvm-tools` |

---

## 📊 Síntesis de Métricas Experimentales Consolidadas

Los resultados de las 10 corridas (5 manuales y 5 automatizadas, intercaladas M-A-M-A...) demuestran con rigor cuantitativo:

1. **Eficiencia Temporal**:
   - **Tiempo Manual Promedio**: **44 minutos 42 segundos** ($s = 104.58\text{ s}$).
   - **Tiempo Automatizado Promedio**: **16 minutos 28 segundos** ($s = 7.19\text{ s}$).
   - **Ahorro de Tiempo**: **28 minutos 14 segundos por ciclo** (**-63.16%** de reducción promedio), erradicando las tareas mecánicas de transferencia de parámetros y tabulación.
2. **Efectividad Diagnóstica**:
   - **Ground Truth de Referencia**: **32 debilidades** conocidas deliberadas.
   - **Vulnerabilidades Detectadas Completas**: **29 de 32** (**90.625%**).
   - **Equivalencia Diagnóstica**: **0.00% de diferencia** entre manual y automatizada (la orquestación preserva al 100% la capacidad de detección del motor OpenVAS).
   - **Límite Estructural del Escaneo No Autenticado**: Las 3 instancias de `PermitRootLogin yes` (CVSS 7.5) no son detectadas por OpenVAS en perfiles de red sin credenciales locales, lo que valida la honestidad metodológica del instrumento frente al falso techo del 100%.

---

## 🖥️ Mapeo de Servidores del Laboratorio

| Contenedor | Dirección IP | Imagen Base | Servicios Expuestos | Vulnerabilidades Deliberadas Principales |
|:---|:---:|:---|:---|:---|
| **vuln-srv1** | `172.18.0.200` | `debian:buster-slim` | vsftpd (21/tcp), OpenSSH (22/tcp) | SSH con ciphers CBC obsoletos y MACs débiles, `PermitRootLogin yes`, FTP anónimo y credenciales en texto claro. |
| **vuln-srv2** | `172.18.0.201` | `httpd:2.4.49` | Apache httpd (80/tcp), OpenSSH (22/tcp) | **CVE-2021-41773** (Path Traversal / RCE en Apache 2.4.49), TRACE habilitado, SSH débil con `PermitRootLogin yes`. |
| **vuln-srv3** | `172.18.0.202` | `ubuntu:20.04` | Apache httpd (80/tcp), vsftpd (21/tcp), OpenSSH (22/tcp) | Directory Listing explícito (`Options Indexes` en `security-lab.conf` vía `a2enconf`), vsftpd anónimo, concurrencia multiprotocolo y SSH débil. |

---

## 🔗 Enlace al Repositorio del Proyecto

**URL:** [https://github.com/TizianoRoig26/Final.git](https://github.com/TizianoRoig26/Final.git)
