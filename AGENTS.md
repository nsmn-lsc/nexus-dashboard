# AGENTS.md — Directrices del Proyecto: Nexus Project Controller

Este documento define la arquitectura técnica, estándares de diseño visual (Cyberpunk UI), modelo de datos y convenciones de código que todos los agentes de IA y desarrolladores deben respetar rigurosamente.

---

## 1. Misión y Visión

**Nexus Project Controller** es un centro de comando personal para desarrolladores e ingenieros de infraestructura. Centraliza el estado de proyectos de software, servicios en ejecución, asignación de puertos locales/remotos, bitácoras operativas (DevLogs) y tareas críticas bajo una interfaz futurista de alta densidad informativa inspirada en terminales cyberpunk/HUD tácticos.

---

## 2. Stack Tecnológico Seleccionado

Para garantizar rendimiento, reactividad inmediata y un acabado visual cyberpunk sin fricciones:

* **Frontend:**
  * **Next.js (App Router, TypeScript, React 19/Canary)**: Permite renderizado híbrido (SSR para vistas estáticas/rápidas y componentes interactivos para HUD táctico).
  * **Tailwind CSS v4 / PostCSS**: Para el control milimétrico de paletas de color neón, opacidades, bordes cortados (`clip-path`) y estados activos.
  * **Lucide React**: Iconografía técnica y minimalista.
  * **Framer Motion**: Microinteracciones tipo HUD, glitches controlados, escaneo de pantallas y transiciones de datos.
  * **Zustand**: Gestión de estado global ligero (filtros de vista, terminales activas, selecciones rápidas).

* **Backend & Persistencia:**
  * **FastAPI (Python 3.12+)** o **Next.js Server Actions / Route Handlers**:
    * *Recomendación:* Empezar con SQLite vía **Prisma ORM** o **Drizzle ORM** integrado directamente en Next.js para un despliegue monorepo autónomo sin dependencias complejas de bases de datos externas; escalable a PostgreSQL mediante variables de entorno cuando se requiera.

---

## 3. Guía de Diseño Visual: Cyberpunk HUD Design System

El diseño debe transmitir la sensación de una consola de operaciones táctica de alta tecnología. Evitar el minimalismo blanco o interfaces estándar SaaS.

### 3.1. Paleta de Colores
* **Fondo Base (`bg-void`):** `#090a0f` / `#0b0e17` (Negro profundo con matiz azul petróleo).
* **Superficies y Paneles (`bg-panel`):** `#111625` con bordes semi-transparentes (`rgba(0, 255, 204, 0.15)`).
* **Primario (Cyan Cyber / Matrix):** `#00ffcc` — Usado para estados activos, bordes de foco, títulos y métricas clave.
* **Acento Eléctrico (Magenta / Neón Pink):** `#ff007f` — Usado para alertas críticas, prioridad máxima y etiquetas especiales.
* **Acento Secundario (Volt Yellow):** `#ffe600` — Advertencias, puertos en colisión, tareas en progreso.
* **Texto Primario:** `#e2e8f0` (Gris claro de alta legibilidad).
* **Texto Secundario / Metadatos:** `#64748b` (Slate tenue).

### 3.2. Tipografía y Microdetalles
* **Tipografías:**
  * Primaria / Display: `JetBrains Mono`, `Fira Code` o `Geist Mono` para una apariencia pura de terminal técnica.
* **Detalles Visuales Obligatorios:**
  * Bordes angulados o cortados mediante `clip-path` en tarjetas y botones.
  * Líneas de escaneo sutiles (`scanlines` vía gradientes CSS lineales de fondo).
  * Indicadores de estado tipo LED pulsante (`animate-pulse`).
  * Textos secundarios en mayúsculas con tracking ancho (`tracking-widest text-xs`).

---

## 4. Estructura de Entidades y Modelo de Datos

```
[Proyecto] (1) <---> (N) [Entorno / Despliegue]
    |
    +-----> (N) [Tarea / Backlog]
    |
    +-----> (N) [Bitácora / DevLog]
    |
    +-----> (N) [Servicio / Puerto Mapeado]
```

### Campos Clave:
1. **Project:** `id`, `slug`, `name`, `description`, `gitUrl`, `status` (`ONLINE`, `STANDBY`, `ARCHIVED`), `category` (`INFRA`, `WEB`, `CLI`, `LAB`), `createdAt`.
2. **Environment:** `id`, `projectId`, `name` (`LOCAL`, `STAGING`, `PROD`), `host`, `port`, `protocol`, `deployMethod` (`CONTAINER`, `SYSTEMD`, `TUNNEL`).
3. **Task:** `id`, `projectId`, `title`, `details`, `priority` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), `status` (`BACKLOG`, `IN_EXEC`, `TESTING`, `DEPLOYED`), `dueDate`.
4. **DevLog:** `id`, `projectId`, `title`, `contentMarkdown`, `loggedAt`.

---

## 5. Reglas de Implementación para Agentes

1. **Prioridad Funcional sobre Adorno:** Aunque la estética sea cyberpunk, el texto y las métricas deben ser 100% legibles. No usar fuentes deformadas ni animaciones que bloqueen el trabajo.
2. **Modularidad:** Todo componente UI debe ser aislado (ej. `<HudCard />`, `<CyberBadge />`, `<GlitchButton />`, `<PortGrid />`).
3. **Operabilidad con Teclado:** Integrar navegación rápida por comandos tipo `Cmd+K` / `Ctrl+K` para saltar de proyecto o registrar un DevLog al instante.
4. **Sin Dependencias Innecesarias:** Preferir utilidades puras de Tailwind y TypeScript tipado antes que librerías pesadas de gráficos o estilos preconstruidos genéricos.



# Guía de Conexión: Servicios de Base de Datos en Podman

Esta guía documenta la infraestructura local de bases de datos aprovisionada mediante Podman Compose (`docker-compose.yml`), incluyendo cadenas de conexión, consideraciones de seguridad SELinux y comandos operativos para depuración rápida.

---

## 1. Definición del Compose

Los servicios locales se encuentran orquestados con la siguiente especificación:

```yaml
services:
  postgres:
    image: docker.io/library/postgres:16-alpine
    container_name: local_postgres
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: devdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-mcp.sql:/docker-entrypoint-initdb.d/01-init-mcp.sql:ro,z
    restart: unless-stopped

  mysql:
    image: docker.io/library/mariadb:lts
    container_name: local_mysql
    environment:
      MARIADB_ROOT_PASSWORD: rootpassword
      MARIADB_DATABASE: devdb
      MARIADB_USER: devuser
      MARIADB_PASSWORD: devpassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  postgres_data:
  mysql_data:
```

---

## 2. Parámetros y Cadenas de Conexión (`.env.local`)

### Opción A: PostgreSQL 16 (Motor Primario Recomendado)

* **Host:** `localhost` (o `127.0.0.1`)
* **Puerto:** `5432`
* **Base de datos:** `devdb`
* **Usuario:** `devuser`
* **Contraseña:** `devpassword`

```env
# Formato estándar de URI de conexión
DATABASE_URL="postgresql://devuser:devpassword@localhost:5432/devdb"
```

### Opción B: MariaDB / MySQL LTS

* **Host:** `localhost` (o `127.0.0.1`)
* **Puerto:** `3306`
* **Base de datos:** `devdb`
* **Usuario:** `devuser` (Root: `root`)
* **Contraseña:** `devpassword` (Root: `rootpassword`)

```env
# Formato estándar de URI de conexión
DATABASE_URL="mysql://devuser:devpassword@localhost:3306/devdb"
```

---

## 3. Comandos de Gestión con Podman

### Ciclo de vida básico

```bash
# Levantar los contenedores en segundo plano
podman compose up -d

# Inspeccionar el estado de ejecución y puertos vinculados
podman ps

# Ver logs en tiempo real (útil para revisar inicialización de scripts SQL)
podman logs -f local_postgres
podman logs -f local_mysql

# Detener los contenedores sin eliminar volúmenes persistentes
podman compose down
```

### Consideración Técnica: SELinux y Volúmenes en Podman Rootless

Al montar archivos locales del host a contenedores rootless en Podman (como `./init-mcp.sql`), es mandatorio mantener el flag `:z` (etiquetado compartido) o `:Z` (etiquetado exclusivo privado):

```text
- ./init-mcp.sql:/docker-entrypoint-initdb.d/01-init-mcp.sql:ro,z
```

* **Por qué es necesario:** Re-etiqueta el contexto SELinux del archivo a `container_file_t`. Sin este indicador, el motor PostgreSQL en el contenedor fallará con un error de tipo `Permission denied` al intentar ejecutar el script de inicialización.

---

## 4. Acceso Directo por Consola (CLI)

Para depurar esquemas, tablas o datos sin depender de herramientas visuales:

### Consola interactiva PostgreSQL (`psql`)
```bash
podman exec -it local_postgres psql -U devuser -d devdb
```

Comandos útiles dentro de `psql`:
* `\dt`: Listar todas las tablas.
* `\d <tabla>`: Describir estructura de columnas e índices.
* `\l`: Listar bases de datos disponibles.
* `\q`: Salir.

### Consola interactiva MariaDB/MySQL (`mariadb`)
```bash
podman exec -it local_mysql mariadb -u devuser -pdevpassword devdb
```

Comandos útiles dentro de `mariadb`:
* `SHOW TABLES;`: Listar tablas creadas.
* `DESCRIBE <tabla>;`: Ver tipos de columnas y llaves.
* `EXIT;`: Salir.