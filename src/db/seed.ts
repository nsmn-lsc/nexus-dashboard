import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import bcrypt from "bcryptjs";
import { db, client } from "./index";
import { users, nodes, projects, projectServices, tasks, devlogs } from "./schema";

async function main() {
  console.log("⚡ [SEED] Iniciando provisionamiento táctico de base de datos...");

  // 1. Crear Usuario Administrador Base
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "NexusAdmin2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  console.log("⚡ [SEED] Creando usuario administrador inicial...");
  const [adminUser] = await db
    .insert(users)
    .values({
      username: "admin",
      email: "admin@nexus.internal",
      passwordHash: passwordHash,
      role: "admin",
    })
    .onConflictDoNothing({ target: users.username })
    .returning();

  if (adminUser) {
    console.log(`✅ [SEED] Usuario admin creado: ${adminUser.username} (${adminUser.email})`);
  } else {
    console.log("ℹ️ [SEED] El usuario admin ya existía en la base de datos.");
  }

  // 2. Crear Nodos Base de Infraestructura
  console.log("⚡ [SEED] Provisionando nodos de infraestructura (Hetzner + Local)...");
  const defaultNodes = [
    {
      name: "hetzner-app-01",
      hostIp: "10.0.1.10",
      role: "app" as const,
      provider: "hetzner" as const,
      status: "online" as const,
    },
    {
      name: "hetzner-db-01",
      hostIp: "10.0.1.20",
      role: "db" as const,
      provider: "hetzner" as const,
      status: "online" as const,
    },
    {
      name: "local-devbox",
      hostIp: "127.0.0.1",
      role: "local" as const,
      provider: "local" as const,
      status: "online" as const,
    },
  ];

  const insertedNodes = await db
    .insert(nodes)
    .values(defaultNodes)
    .onConflictDoNothing({ target: nodes.name })
    .returning();

  console.log(`✅ [SEED] Nodos registrados: ${insertedNodes.length || defaultNodes.length}`);

  // 3. Crear Proyecto Inicial
  console.log("⚡ [SEED] Registrando proyecto Nexus Dashboard...");
  const [nexusProject] = await db
    .insert(projects)
    .values({
      name: "Nexus Project Controller",
      slug: "nexus-controller",
      description: "Centro de comando táctico para servicios, puertos e infraestructura Hetzner",
      type: "infra",
      repoUrl: "https://github.com/organization/nx_controller",
      defaultBranch: "main",
      status: "active",
    })
    .onConflictDoNothing({ target: projects.slug })
    .returning();

  const targetProjectId = nexusProject?.id;

  if (targetProjectId) {
    // Buscar nodo hetzner-app-01
    const appNode = insertedNodes.find((n) => n.name === "hetzner-app-01");

    if (appNode) {
      // 4. Registrar Servicio Base (Caddy / Next.js)
      console.log("⚡ [SEED] Vinculando servicios iniciales del proyecto...");
      await db.insert(projectServices).values([
        {
          projectId: targetProjectId,
          nodeId: appNode.id,
          port: 443,
          internalPort: 3000,
          protocol: "https",
          serviceType: "caddy",
          status: "running",
        },
        {
          projectId: targetProjectId,
          nodeId: appNode.id,
          port: 3000,
          internalPort: 3000,
          protocol: "http",
          serviceType: "systemd",
          status: "running",
        },
      ]);
    }

    // 5. Tarea Inicial
    console.log("⚡ [SEED] Creando backlog táctico inicial...");
    await db.insert(tasks).values([
      {
        projectId: targetProjectId,
        title: "Sprint 1: Autenticación HUD y Shell de Control",
        description: "Implementar NextAuth con Auth.js v5, Drizzle ORM y diseño cyberpunk",
        priority: "p1",
        status: "in_progress",
      },
      {
        projectId: targetProjectId,
        title: "Monitoreo de Telemetría Systemd",
        description: "Crear daemon de telemetría remota para estados de servicios en nodos Hetzner",
        priority: "p2",
        status: "backlog",
      },
    ]);

    // 6. DevLog Inicial
    console.log("⚡ [SEED] Registrando bitácora de ingeniería inicial...");
    await db.insert(devlogs).values({
      projectId: targetProjectId,
      title: "Desacoplamiento de Base de Datos y Arquitectura Hetzner",
      markdownContent: `### Arquitectura Inicial
- Servidor web Next.js en nodo de aplicación bajo Caddy.
- Base de datos PostgreSQL desacoplada (compatible con Podman en dev y systemd en Hetzner prod).
- Rate-limiting en endpoints de autenticación y sesiones JWT cifradas.`,
    });
  }

  console.log("🚀 [SEED] Base de datos provisionada exitosamente.");
}

main()
  .catch((err) => {
    console.error("❌ [SEED ERROR]:", err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
