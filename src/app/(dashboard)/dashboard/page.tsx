import React from "react";
import { db } from "@/db";
import { projects, nodes, projectServices, tasks } from "@/db/schema";
import { HudCard } from "@/components/hud/HudCard";
import { HudBadge } from "@/components/hud/HudBadge";
import { HudButton } from "@/components/hud/HudButton";
import { Server, Network, FolderKanban, ListTodo, Shield, ExternalLink } from "lucide-react";
import Link from "next/link";
import { CreateProjectModal } from "@/components/hud/CreateProjectModal";

export default async function DashboardPage() {
  // Carga de telemetría directamente del modelo relacional desacoplado
  const allProjects = await db.select().from(projects);
  const allNodes = await db.select().from(nodes);
  const allServices = await db.select().from(projectServices);
  const allTasks = await db.select().from(tasks);

  return (
    <div className="space-y-6">
      {/* Banner Superior Táctico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-panel-border/30 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-rajdhani tracking-wide text-white flex items-center gap-2">
            PANEL DE OPERACIONES // ESTADO GLOBAL
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Telemetría de nodos Hetzner, puertos asignados y proyectos en ejecución.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CreateProjectModal />
          <HudBadge variant="cyan">NODOS HETZNER: {allNodes.length}</HudBadge>
          <HudBadge variant="green" pulse>
            SERVICIOS ACTIVOS: {allServices.length}
          </HudBadge>
        </div>
      </div>

      {/* Grid de Métricas HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HudCard>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">Proyectos</span>
            <FolderKanban className="w-4 h-4 text-hud-cyan" />
          </div>
          <div className="text-3xl font-bold font-rajdhani text-white">
            {allProjects.length.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2">
            100% REGISTRADOS EN CORE
          </div>
        </HudCard>

        <HudCard>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">Infraestructura Nodos</span>
            <Server className="w-4 h-4 text-hud-green" />
          </div>
          <div className="text-3xl font-bold font-rajdhani text-white">
            {allNodes.length.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2">
            PROVEEDOR: HETZNER / LOCAL
          </div>
        </HudCard>

        <HudCard>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">Puertos Mapeados</span>
            <Network className="w-4 h-4 text-hud-yellow" />
          </div>
          <div className="text-3xl font-bold font-rajdhani text-white">
            {allServices.length.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2">
            PROTOCOLOS: TCP / HTTP / HTTPS
          </div>
        </HudCard>

        <HudCard>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-mono text-xs uppercase tracking-wider">Tareas en Backlog</span>
            <ListTodo className="w-4 h-4 text-hud-magenta" />
          </div>
          <div className="text-3xl font-bold font-rajdhani text-white">
            {allTasks.length.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2">
            SPRINT 1 EN EJECUCIÓN
          </div>
        </HudCard>
      </div>

      {/* Tabla Táctica de Proyectos Registrados */}
      <HudCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-panel-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-hud-cyan" />
            <h2 className="font-rajdhani font-bold text-lg text-white tracking-wide">
              PROYECTOS VINCULADOS
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/projects"
              className="text-xs font-mono text-hud-cyan hover:underline flex items-center gap-1"
            >
              <span>VER CATÁLOGO COMPLETO</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <span className="text-xs font-mono text-slate-500">
              TOTAL: {allProjects.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0b101c] text-slate-400 border-b border-panel-border/20 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">Nombre / Slug</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Rama</th>
                <th className="px-5 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-border/20">
              {allProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500 font-mono text-xs">
                    No hay proyectos registrados en el sistema. Utiliza el botón de arriba para registrar uno.
                  </td>
                </tr>
              ) : (
                allProjects.map((p) => (
                <tr key={p.id} className="hover:bg-panel-light/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-200">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.slug}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-hud-cyan uppercase">{p.type}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <HudBadge
                      variant={p.status === "active" ? "green" : "yellow"}
                      pulse={p.status === "active"}
                    >
                      {p.status}
                    </HudBadge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">
                    {p.defaultBranch || "main"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {p.repoUrl && (
                      <a
                        href={p.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-hud-cyan hover:underline"
                      >
                        <span>REPO</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </HudCard>
    </div>
  );
}
