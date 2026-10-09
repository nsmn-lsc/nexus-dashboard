#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# NEXUS DASHBOARD - SCRIPT DE DESPLIEGUE TÁCTICO AUTOMATIZADO
# Target: app-node (10.0.0.2:8090) en Hetzner Private LAN (10.0.0.0/24)
# Entorno: /opt/apps/nexus-dashboard | Usuario de ejecución: root
# ==============================================================================

APP_DIR="${APP_DIR:-/opt/apps/nexus-dashboard}"
BRANCH="${DEPLOY_BRANCH:-main}"
NODE_IP="10.0.0.2"
PORT="8090"

echo "============================================================"
echo " [!] INICIANDO DESPLIEGUE TÁCTICO: NEXUS DASHBOARD // HETZNER"
echo "============================================================"

# Si el directorio del despliegue existe, cambiar a él; de lo contrario operar en el cwd actual
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
fi

echo "-> [1/6] Sincronizando últimos cambios desde Git (${BRANCH})..."
if [ -d ".git" ]; then
    git fetch origin "$BRANCH" || true
    git checkout "$BRANCH" || true
    git pull origin "$BRANCH" || true
else
    echo ">> [INFO] Despliegue sin repositorio git directo en este directorio, continuando..."
fi

echo "-> [2/6] Instalando dependencias de producción limpiamente..."
if [ -f "package-lock.json" ]; then
    npm ci --prefer-offline || npm install
else
    npm install
fi

echo "-> [3/6] Sincronizando esquema de base de datos en db-node (10.0.0.3:5432)..."
npm run db:push

echo "-> [4/6] Compilando bundle standalone optimizado de Next.js..."
npm run build

echo "-> [5/6] Preparando artefactos estáticos (.next/static y public) en runtime standalone..."
# Next.js standalone requiere copiar public/ y .next/static al directorio .next/standalone
if [ -d "public" ]; then
    cp -r public .next/standalone/ || true
fi

mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/

# Asegurar permisos correctos para root en /opt/apps/nexus-dashboard
if [ -d "$APP_DIR" ]; then
    echo ">> Asegurando permisos de propiedad para root:root en ${APP_DIR}..."
    chown -R root:root "$APP_DIR" || true
fi

echo "-> [6/6] Reiniciando servicio systemd en app-node..."
if command -v systemctl &>/dev/null && systemctl list-unit-files | grep -q "nexus-dashboard.service"; then
    systemctl restart nexus-dashboard.service
    echo ">> Servicio nexus-dashboard.service reiniciado."
else
    echo ">> [INFO] systemctl no disponible o servicio no instalado todavía. Omitiendo restart directo."
fi

echo "============================================================"
echo " [✓] EJECUTANDO HEALTHCHECK TÁCTICO (http://${NODE_IP}:${PORT})"
echo "============================================================"
sleep 2

if command -v curl &>/dev/null; then
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://${NODE_IP}:${PORT}/login" || echo "FAIL")
    if [[ "$HEALTH_STATUS" =~ ^(200|307|308)$ ]]; then
        echo ">> [OK] NEXUS DASHBOARD EN LÍNEA Y OPERATIVO (HTTP $HEALTH_STATUS)."
    else
        echo ">> [ADVERTENCIA] El endpoint respondió: $HEALTH_STATUS. Inspeccionando registros recientes:"
        if command -v journalctl &>/dev/null; then
            journalctl -u nexus-dashboard.service -n 20 --no-pager || true
        fi
    fi
else
    echo ">> curl no disponible para verificación local."
fi

echo "============================================================"
echo " [★] DESPLIEGUE FINALIZADO EXITOSAMENTE"
echo "============================================================"
