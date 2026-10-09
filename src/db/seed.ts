import * as dotenv from "dotenv";
dotenv.config({ path: ".env.production" });
dotenv.config({ path: ".env.local" });
dotenv.config();

import bcrypt from "bcryptjs";
import { db, client } from "./index";
import { users, nodes, projects, projectServices, tasks, devlogs } from "./schema";

async function main() {
  console.log("⚡ [SEED] Iniciando provisionamiento táctico de infraestructura Hetzner...");

  // 1. Crear Usuario Administrador Base
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "NexusAdmin2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  console.log("⚡ [SEED] Verificando usuario administrador inicial...");
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
    console.log("ℹ️ [SEED] El usuario admin ya existe en la base de datos.");
  }

  // 2. Nodos Reales del Cluster Hetzner (10.0.0.0/24 LAN privada)
  console.log("⚡ [SEED] Provisionando topología de 3 nodos Hetzner...");
  const clusterNodes = [
    {
      name: "app-node",
      hostIp: "10.0.0.2",
      privateIp: "10.0.0.2",
      role: "app" as const,
      provider: "hetzner" as const,
      status: "online" as const,
    },
    {
      name: "db-node",
      hostIp: "10.0.0.3",
      privateIp: "10.0.0.3",
      role: "db" as const,
      provider: "hetzner" as const,
      status: "online" as const,
    },
    {
      name: "file-node",
      hostIp: "10.0.0.4",
      privateIp: "10.0.0.4",
      role: "storage" as const,
      provider: "hetzner" as const,
      status: "online" as const,
    },
  ];

  for (const n of clusterNodes) {
    await db
      .insert(nodes)
      .values(n)
      .onConflictDoUpdate({
        target: nodes.name,
        set: {
          hostIp: n.hostIp,
          privateIp: n.privateIp,
          role: n.role,
          provider: n.provider,
          status: n.status,
        },
      });
  }

  const allActiveNodes = await db.select().from(nodes);
  console.log(`✅ [SEED] Nodos de cluster registrados: ${allActiveNodes.length}`);

  const appNode = allActiveNodes.find((n) => n.name === "app-node");
  const dbNode = allActiveNodes.find((n) => n.name === "db-node");
  const fileNode = allActiveNodes.find((n) => n.name === "file-node");

  // 3. Crear Proyectos Inventariados de la Infraestructura
  console.log("⚡ [SEED] Provisionando proyectos inventariados en infra_context.md...");

  // 3.1. Nexus Project Controller
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

  // 3.2. MARO Hub (Frontend/Backend en puerto 3000)
  const [maroProject] = await db
    .insert(projects)
    .values({
      name: "MARO Hub",
      slug: "maro-hub",
      description: "Plataforma central y portal operativo de servicios",
      type: "laboral",
      repoUrl: "https://github.com/organization/maro_hub",
      defaultBranch: "main",
      status: "active",
    })
    .onConflictDoNothing({ target: projects.slug })
    .returning();

  // 3.3. PostgreSQL Core Engine
  const [postgresProject] = await db
    .insert(projects)
    .values({
      name: "PostgreSQL Database Engine",
      slug: "postgres-db-engine",
      description: "Instancia nativa PostgreSQL 16 bajo systemd en nodo dedicado db-node",
      type: "infra",
      repoUrl: null,
      defaultBranch: "main",
      status: "active",
    })
    .onConflictDoNothing({ target: projects.slug })
    .returning();

  // 3.4. Caddy Ingress Gateway
  const [caddyProject] = await db
    .insert(projects)
    .values({
      name: "Caddy Ingress Gateway",
      slug: "caddy-ingress-gateway",
      description: "Reverse proxy TLS, terminación SSL y enrutamiento hacia app-node",
      type: "infra",
      repoUrl: null,
      defaultBranch: "main",
      status: "active",
    })
    .onConflictDoNothing({ target: projects.slug })
    .returning();

  // Recuperar proyectos completos de la base de datos
  const allProjects = await db.select().from(projects);
  const targetNexus = allProjects.find((p) => p.slug === "nexus-controller");
  const targetMaro = allProjects.find((p) => p.slug === "maro-hub");
  const targetPostgres = allProjects.find((p) => p.slug === "postgres-db-engine");
  const targetCaddy = allProjects.find((p) => p.slug === "caddy-ingress-gateway");

  // 4. Mapeo de Servicios de Infraestructura (Puertos reales inventariados)
  console.log("⚡ [SEED] Mapeando servicios y puertos en el cluster...");

  // Nexus Dashboard en app-node puerto 8090
  if (targetNexus && appNode) {
    await db.insert(projectServices).values([
      {
        projectId: targetNexus.id,
        nodeId: appNode.id,
        port: 8090,
        internalPort: 8090,
        protocol: "http",
        serviceType: "systemd",
        status: "running",
      },
    ]);
  }

  // MARO Hub en app-node puerto 3000
  if (targetMaro && appNode) {
    await db.insert(projectServices).values([
      {
        projectId: targetMaro.id,
        nodeId: appNode.id,
        port: 3000,
        internalPort: 3000,
        protocol: "http",
        serviceType: "systemd",
        status: "running",
      },
    ]);
  }

  // PostgreSQL nativo en db-node puerto 5432
  if (targetPostgres && dbNode) {
    await db.insert(projectServices).values([
      {
        projectId: targetPostgres.id,
        nodeId: dbNode.id,
        port: 5432,
        internalPort: 5432,
        protocol: "tcp",
        serviceType: "systemd",
        status: "running",
      },
    ]);
  }

  // Caddy Ingress en file-node puertos 80 y 443
  if (targetCaddy && fileNode) {
    await db.insert(projectServices).values([
      {
        projectId: targetCaddy.id,
        nodeId: fileNode.id,
        port: 443,
        internalPort: 443,
        protocol: "https",
        serviceType: "caddy",
        status: "running",
      },
      {
        projectId: targetCaddy.id,
        nodeId: fileNode.id,
        port: 80,
        internalPort: 80,
        protocol: "http",
        serviceType: "caddy",
        status: "running",
      },
    ]);
  }

  // 5. Tareas Iniciales del Despliegue
  if (targetNexus) {
    console.log("⚡ [SEED] Vinculando backlog operativo de despliegue...");
    await db.insert(tasks).values([
      {
        projectId: targetNexus.id,
        title: "Despliegue de servicio systemd en app-node (10.0.0.2)",
        description: "Instalar nexus-dashboard.service en /etc/systemd/system y habilitar inicio automático",
        priority: "p1",
        status: "in_progress",
      },
      {
        projectId: targetNexus.id,
        title: "Configuración de ingress en Caddy (file-node: 10.0.0.4)",
        description: "Incorporar Caddyfile.snippet y recargar Caddy para exponer nexus.filenode.dev",
        priority: "p1",
        status: "backlog",
      },
      {
        projectId: targetNexus.id,
        title: "Verificación de aislamiento LAN en db-node (10.0.0.3)",
        description: "Validar que PostgreSQL acepte conexiones de 10.0.0.2 con sslmode=disable sin exposición pública",
        priority: "p2",
        status: "done",
      },
    ]);

    // 6. DevLog de Despliegue
    console.log("⚡ [SEED] Registrando bitácora técnica de arquitectura...");
    await db.insert(devlogs).values([
      {
        projectId: targetNexus.id,
        title: "Plan de Despliegue en Cluster Hetzner (10.0.0.0/24)",
        markdownContent: `### Topología del Cluster
- **app-node (10.0.0.2):** Corre Nexus Dashboard en puerto **8090/tcp** (evitando colisión con puerto 3000 de MARO Hub).
- **db-node (10.0.0.3):** Servicio nativo systemd de PostgreSQL 16 accesible en puerto **5432/tcp** con \`sslmode=disable\` por red privada.
- **file-node (10.0.0.4):** Ingress Gateway público con Caddy que termina TLS y redirige hacia \`10.0.0.2:8090\` con buffering desactivado (\`flush_interval -1\`).

\`\`\`bash
# Despliegue en un solo paso
./deploy.sh
\`\`\``,
      },
    ]);
  }

  console.log("🚀 [SEED] Base de datos provisionada exitosamente para el cluster Hetzner.");
}

main()
  .catch((err) => {
    console.error("❌ [SEED ERROR]:", err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
