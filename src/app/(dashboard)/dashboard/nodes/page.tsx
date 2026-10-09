import React from "react";
import { db } from "@/db";
import { nodes, projectServices, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NodesClient } from "@/components/nodes/NodesClient";
import { NodeItem, NodeServiceItem } from "@/components/nodes/NodeCard";

export default async function NodesPage() {
  // Carga todos los nodos
  const allNodes = await db
    .select()
    .from(nodes)
    .orderBy(desc(nodes.name));

  // Carga todos los servicios mapeados con datos del proyecto
  const allServices = await db
    .select({
      id: projectServices.id,
      nodeId: projectServices.nodeId,
      projectId: projectServices.projectId,
      projectName: projects.name,
      projectSlug: projects.slug,
      port: projectServices.port,
      internalPort: projectServices.internalPort,
      protocol: projectServices.protocol,
      serviceType: projectServices.serviceType,
      status: projectServices.status,
    })
    .from(projectServices)
    .innerJoin(projects, eq(projectServices.projectId, projects.id));

  // Combinar nodos con sus servicios alojados
  const formattedNodes: NodeItem[] = allNodes.map((n) => ({
    id: n.id,
    name: n.name,
    hostIp: n.hostIp,
    privateIp: n.privateIp,
    role: n.role,
    provider: n.provider,
    status: n.status,
    services: allServices
      .filter((s) => s.nodeId === n.id)
      .map((s) => ({
        id: s.id,
        projectId: s.projectId,
        projectName: s.projectName,
        projectSlug: s.projectSlug,
        port: s.port,
        internalPort: s.internalPort,
        protocol: s.protocol,
        serviceType: s.serviceType,
        status: s.status,
      })),
  }));

  return (
    <div className="space-y-6">
      {/* Encabezado Táctico del Módulo */}
      <div className="border-b border-panel-border/30 pb-4">
        <h1 className="text-3xl font-bold font-rajdhani tracking-wide text-white flex items-center gap-2">
          NODOS DE INFRAESTRUCTURA // HETZNER & LOCAL
        </h1>
        <p className="text-xs font-mono text-slate-400">
          Control de servidores de cómputo, bases de datos nativas systemd, asignación de VLANs privadas y acceso SSH.
        </p>
      </div>

      <NodesClient initialNodes={formattedNodes} />
    </div>
  );
}
