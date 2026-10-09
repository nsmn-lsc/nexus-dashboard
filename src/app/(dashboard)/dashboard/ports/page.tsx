import React from "react";
import { db } from "@/db";
import { projects, nodes, projectServices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PortMatrixClient, PortMatrixItem } from "@/components/hud/PortMatrixClient";

export default async function PortsPage() {
  // Cargar todos los servicios con información de proyecto y nodo
  const rawServices = await db
    .select({
      id: projectServices.id,
      port: projectServices.port,
      internalPort: projectServices.internalPort,
      protocol: projectServices.protocol,
      serviceType: projectServices.serviceType,
      status: projectServices.status,
      projectId: projects.id,
      projectName: projects.name,
      projectSlug: projects.slug,
      nodeId: nodes.id,
      nodeName: nodes.name,
      nodeHostIp: nodes.hostIp,
      nodeProvider: nodes.provider,
    })
    .from(projectServices)
    .innerJoin(projects, eq(projectServices.projectId, projects.id))
    .innerJoin(nodes, eq(projectServices.nodeId, nodes.id));

  const allNodes = await db.select({ id: nodes.id, name: nodes.name }).from(nodes);

  return (
    <div className="space-y-6">
      <div className="border-b border-panel-border/30 pb-4">
        <h1 className="text-3xl font-bold font-rajdhani tracking-wide text-white flex items-center gap-2">
          AUDITORÍA GLOBAL DE PUERTOS // PORT MATRIX
        </h1>
        <p className="text-xs font-mono text-slate-400">
          Monitoreo de puertos abiertos, colisiones en nodos de infraestructura y enrutamiento Caddy/Systemd.
        </p>
      </div>

      <PortMatrixClient
        services={rawServices as PortMatrixItem[]}
        nodes={allNodes}
      />
    </div>
  );
}
