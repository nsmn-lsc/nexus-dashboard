import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Cliente de Base de Datos desacoplado del runtime:
 * Compatible tanto con desarrollo en Podman/Docker como con instancias
 * PostgreSQL nativas bajo systemd en nodos de infraestructura remota (Hetzner).
 */

const connectionString =
  process.env.DATABASE_URL || "postgresql://devuser:devpassword@localhost:5432/devdb";

const maxConnections = process.env.DB_MAX_CONNECTIONS
  ? parseInt(process.env.DB_MAX_CONNECTIONS, 10)
  : 10;

const idleTimeout = process.env.DB_IDLE_TIMEOUT
  ? parseInt(process.env.DB_IDLE_TIMEOUT, 10)
  : 20;

const connectTimeout = process.env.DB_CONNECT_TIMEOUT
  ? parseInt(process.env.DB_CONNECT_TIMEOUT, 10)
  : 10;

// Opciones dinámicas de SSL/TLS (habilitable para conexiones inter-nodo protegidas)
const sslOption =
  process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : false;

// Cliente de bajo nivel postgres.js con pool sizing desacoplado
const client = postgres(connectionString, {
  max: maxConnections,
  idle_timeout: idleTimeout,
  connect_timeout: connectTimeout,
  ssl: sslOption,
  prepare: false, // Recomendado para compatibilidad con PgBouncer / Proxies si se escala
});

export const db = drizzle(client, { schema });
export { client };
