import React from "react";
import { db } from "@/db";
import { projects, nodes, projectServices, tasks } from "@/db/schema";
import { HudCard } from "@/components/hud/HudCard";
import { HudBadge } from "@/components/hud/HudBadge";
import { HudButton } from "@/components/hud/HudButton";
import { Server, Network, FolderKanban, ListTodo, Shield, ExternalLink, Activity, Radio } from "lucide-react";
import Link from "next/link";
import { CreateProjectModal } from "@/components/hud/CreateProjectModal";
import { ScrambleNumber } from "@/components/hud/ScrambleNumber";
import { HudSparkline } from "@/components/hud/HudSparkline";

export default async function DashboardPage() {
  // Carga de telemetría directamente del modelo relacional desacoplado
  const allProjects = await db.select().from(projects);
  const allNodes = await db.select().from(nodes);
  const allServices = await db.select().from(projectServices);
  const allTasks = await db.select().from(tasks);

  const onlineNodes = allNodes.filter((n) => n.status === "online").length;
  const runningServices = allServices.filter((s) => s.status === "running").length;

  return (
    <div className="space-y-6">
      {/* Banner Superior Táctico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-panel-border/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-hud-green opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-hud-green" />
            </span>
            <span className="font-mono text-[10px] text-hud-cyan tracking-[0.25em] uppercase font-semibold">
              TELEMETRÍA EN VIVO // CENTRO DE MANDO HETZNER
            </span>
          </div>
          <h1 className="text-3xl font-bold font-rajdhani tracking-wide text-white flex items-center gap-2">
            PANEL DE OPERACIONES // ESTADO GLOBAL
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Telemetría de nodos Hetzner, puertos asignados y proyectos en ejecución.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <CreateProjectModal />
          <HudBadge variant="cyan">
            NODOS: {onlineNodes}/{allNodes.length}
          </HudBadge>
          <HudBadge variant="green" pulse>
            SERVICIOS: {runningServices}/{allServices.length}
          </HudBadge>
        </div>
      </div>

      {/* Grid de Métricas HUD con Telemetría Animada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1: Proyectos */}
        <HudCard className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider">Proyectos Core</span>
            <FolderKanban className="w-4 h-4 text-hud-cyan" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold font-rajdhani text-white">
              <ScrambleNumber value={allProjects.length} />
            </div>
            <span className="font-mono text-[10px] text-hud-cyan border border-hud-cyan/30 px-1.5 py-0.5 bg-hud-cyan/10">
              ACTIVOS
            </span>
          </div>
          <HudSparkline color="cyan" />
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-panel-border/20 pt-1.5">
            <span>REGISTRO EN CORE</span>
            <span className="text-hud-cyan">100% ENLACE</span>
          </div>
        </HudCard>

        {/* Tarjeta 2: Nodos de Infraestructura */}
        <HudCard className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider">Infraestructura Nodos</span>
            <Server className="w-4 h-4 text-hud-green" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold font-rajdhani text-white">
              <ScrambleNumber value={allNodes.length} />
            </div>
            <span className="font-mono text-[10px] text-hud-green border border-hud-green/30 px-1.5 py-0.5 bg-hud-green/10 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-hud-green animate-pulse" />
              {onlineNodes} ONLINE
            </span>
          </div>
          <HudSparkline color="green" />
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-panel-border/20 pt-1.5">
            <span>PROVEEDOR</span>
            <span className="text-hud-green">HETZNER / LOCAL</span>
          </div>
        </HudCard>

        {/* Tarjeta 3: Puertos Mapeados */}
        <HudCard className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider">Puertos Mapeados</span>
            <Network className="w-4 h-4 text-hud-yellow" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold font-rajdhani text-white">
              <ScrambleNumber value={allServices.length} />
            </div>
            <span className="font-mono text-[10px] text-hud-yellow border border-hud-yellow/30 px-1.5 py-0.5 bg-hud-yellow/10">
              {runningServices} EN ESCUCHA
            </span>
          </div>
          <HudSparkline color="yellow" />
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-panel-border/20 pt-1.5">
            <span>PROTOCOLOS</span>
            <span className="text-hud-yellow">TCP / HTTP / SSL</span>
          </div>
        </HudCard>

        {/* Tarjeta 4: Tareas en Backlog */}
        <HudCard className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider">Tareas en Backlog</span>
            <ListTodo className="w-4 h-4 text-hud-magenta" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold font-rajdhani text-white">
              <ScrambleNumber value={allTasks.length} />
            </div>
            <span className="font-mono text-[10px] text-hud-magenta border border-hud-magenta/30 px-1.5 py-0.5 bg-hud-magenta/10">
              SPRINT 1
            </span>
          </div>
          <HudSparkline color="magenta" />
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-panel-border/20 pt-1.5">
            <span>PLANIFICACIÓN</span>
            <span className="text-hud-magenta">EN EJECUCIÓN</span>
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
                <th className="px-5 py-3 font-medium">Tipo / Stack</th>
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-hud-cyan uppercase">{p.type}</span>
                      <span className="text-[10px] text-hud-yellow border border-hud-yellow/30 bg-hud-yellow/10 px-1.5 py-0.5 uppercase">
                        {p.framework || "django"}
                      </span>
                    </div>
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
