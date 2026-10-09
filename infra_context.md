# Paquete de Despliegue: Nexus Dashboard en Cluster Hetzner

Este documento contiene la especificación técnica, configuraciones de servicio, reglas de proxy inverso y el script automatizado para desplegar **Nexus Dashboard** en producción respetando estrictamente la topología del cluster de 3 nodos.

---

## 1. Asignación de Red y Puertos

Basado en la auditoría de `infra_context.md`:
* **Host de Ejecución:** `app-node` (`10.0.0.2` LAN privada).
* **Puerto Asignado:** `8090/tcp` (libre de colisiones; no interfiere con `3000` de MARO Hub ni con Django/FastAPI).
* **Host de Base de Datos:** `db-node` (`10.0.0.3:5432` PostgreSQL 16 nativo).
* **Ingress / Reverse Proxy:** `file-node` (`10.0.0.4` Caddy TLS en puertos 80/443).
* **Subdominio Propuesto:** `nexus.filenode.dev` (o `ops-hud.filenode.dev`).

---

## 2. Variables de Entorno de Producción (`.env.production`)

Ubicado en `app-node` en `/opt/nexus-dashboard/.env.production`:

```env
# Runtime
NODE_ENV="production"
PORT=8090
HOSTNAME="10.0.0.2"

# Conexión a Base de Datos (db-node en red privada)
DATABASE_URL="postgresql://nexus_user:TuPasswordSeguro@10.0.0.3:5432/nexus_db?sslmode=disable"
DB_SSL="false"
DB_MAX_CONNECTIONS=10

# NextAuth / Auth.js (Detrás de Caddy Proxy)
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="https://nexus.filenode.dev"
NEXTAUTH_SECRET="GenerarCon_openssl_rand_base64_32"
```

---

## 3. Servicio Systemd (`/etc/systemd/system/nexus-dashboard.service`)

Para instalar en **`app-node` (`10.0.0.2`)**:

```ini
[Unit]
Description=Nexus Dashboard - Project & Infrastructure HUD
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/apps/nexus-dashboard
EnvironmentFile=/opt/apps/nexus-dashboard/.env.production

# Ejecución del bundle standalone generado por Next.js
ExecStart=/usr/bin/node /opt/apps/nexus-dashboard/.next/standalone/server.js

Restart=always
RestartSec=3s
KillMode=control-group

# Sandboxing y Seguridad Linux
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
CapabilityBoundingSet=

# Límites de descriptores y memoria
LimitNOFILE=65535
MemoryMax=1G

[Install]
WantedBy=multi-user.target
```

---

## 4. Configuración de Reverse Proxy en Caddy (`file-node: 10.0.0.4`)

Añadir en `/etc/caddy/Caddyfile` de **`file-node`**:

```caddy
nexus.filenode.dev {
    # Proxy inverso apuntando al puerto 8090 de app-node en la red privada
    reverse_proxy 10.0.0.2:8090 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        
        # Buffering y timeouts para Server Actions
        flush_interval -1
    }

    # Cabeceras de seguridad
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Compresión moderna
    encode zstd gzip

    # Log de accesos
    log {
        output file /var/log/caddy/nexus_access.log {
            roll_size 50mb
            roll_keep 5
        }
    }
}
```

---

## 5. Script de Despliegue Automatizado (`deploy.sh`)

Ubicado en la raíz del proyecto para ejecutarse en `app-node`:

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/nexus-dashboard"
BRANCH="main"

echo "=========================================="
echo " [!] INICIANDO DESPLIEGUE: NEXUS DASHBOARD"
echo "=========================================="

cd "$APP_DIR"

echo "-> [1/6] Descargando últimos cambios de Git (${BRANCH})..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "-> [2/6] Instalando dependencias de producción..."
npm ci --prefer-offline

echo "-> [3/6] Ejecutando migraciones de base de datos en db-node (10.0.0.3)..."
npm run db:push

echo "-> [4/6] Compilando bundle standalone de Next.js..."
npm run build

echo "-> [5/6] Preparando artefactos estáticos para el runtime standalone..."
# Next.js standalone requiere copiar las carpetas public y static al directorio standalone
cp -r public .next/standalone/ || true
cp -r .next/static .next/standalone/.next/

# Asegurar permisos correctos para el usuario www-data
chown -R www-data:www-data "$APP_DIR"

echo "-> [6/6] Reiniciando servicio systemd..."
sudo systemctl restart nexus-dashboard.service

echo "=========================================="
echo " [✓] VERIFICANDO ESTADO OPERATIVO (PORT 8090)"
echo "=========================================="
sleep 2

if curl -s -o /dev/null -w "%{http_code}" http://10.0.0.2:8090/login | grep -q "200\|307"; then
    echo ">> NEXUS DASHBOARD EN LÍNEA Y RESPONDIENDO OK."
else
    echo ">> [ALERTA] El servicio no respondió HTTP 200/307. Verificando journalctl:"
    sudo journalctl -u nexus-dashboard.service -n 20 --no-pager
    exit 1
fi
```