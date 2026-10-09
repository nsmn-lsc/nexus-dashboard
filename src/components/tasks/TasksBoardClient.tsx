"use client";

import React, { useState, useMemo } from "react";
import { HudCard } from "@/components/hud/HudCard";
import { HudButton } from "@/components/hud/HudButton";
import { HudBadge } from "@/components/hud/HudBadge";
import { TaskCard, TaskItem } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";
import { 
  Kanban, 
  List, 
  Search, 
  Filter, 
  Layers, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  Eye
} from "lucide-react";

interface TasksBoardClientProps {
  initialTasks: TaskItem[];
  projects: Array<{ id: string; name: string }>;
}

const KANBAN_COLUMNS: Array<{
  id: TaskItem["status"];
  label: string;
  icon: React.ElementType;
  badgeVariant: "muted" | "cyan" | "yellow" | "green";
}> = [
  { id: "backlog", label: "BACKLOG", icon: Clock, badgeVariant: "muted" },
  { id: "in_progress", label: "EN PROGRESO", icon: Layers, badgeVariant: "cyan" },
  { id: "review", label: "EN REVISIÓN", icon: Eye, badgeVariant: "yellow" },
  { id: "done", label: "COMPLETADO", icon: CheckCircle2, badgeVariant: "green" },
];

export function TasksBoardClient({ initialTasks, projects }: TasksBoardClientProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filtrado reactivo en vivo
  const filteredTasks = useMemo(() => {
    return initialTasks.filter((task) => {
      // Filtro Proyecto
      if (selectedProject !== "all" && task.projectId !== selectedProject) {
        return false;
      }
      // Filtro Prioridad
      if (selectedPriority !== "all" && task.priority !== selectedPriority) {
        return false;
      }
      // Filtro Texto
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query) ?? false;
        const matchesProject = task.projectName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesProject) {
          return false;
        }
      }
      return true;
    });
  }, [initialTasks, selectedProject, selectedPriority, searchQuery]);

  // Contadores métricos
  const metrics = useMemo(() => {
    const total = initialTasks.length;
    const critical = initialTasks.filter((t) => t.priority === "p1" && t.status !== "done").length;
    const inProgress = initialTasks.filter((t) => t.status === "in_progress").length;
    const completed = initialTasks.filter((t) => t.status === "done").length;
    return { total, critical, inProgress, completed };
  }, [initialTasks]);

  return (
    <div className="space-y-6">
      {/* Telemetría Superior del Tablero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HudCard>
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>TOTAL TAREAS SPRINT</span>
            <Layers className="w-4 h-4 text-hud-cyan" />
          </div>
          <div className="text-3xl font-bold font-rajdhani text-white">
            {metrics.total.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            DISTRIBUIDAS EN {projects.length} PROYECTOS
          </div>
        </HudCard>

        <HudCard variant={metrics.critical > 0 ? "danger" : "default"}>
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>BLOQUEANTES // CRÍTICOS</span>
            <AlertOctagon className={`w-4 h-4 ${metrics.critical > 0 ? "text-hud-magenta animate-pulse" : "text-slate-500"}`} />
          </div>
          <div className={`text-3xl font-bold font-rajdhani ${metrics.critical > 0 ? "text-hud-magenta" : "text-slate-300"}`}>
            {metrics.critical.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            {metrics.critical > 0 ? "REQUIERE INTERVENCIÓN INMEDIATA" : "SIN BLOQUEOS ACTIVOS"}
          </div>
        </HudCard>

        <HudCard>
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>EN EJECUCIÓN // WIP</span>
            <Clock className="w-4 h-4 text-hud-yellow" />
          </div>
          <div className="text-3xl font-bold font-rajdhani text-hud-yellow">
            {metrics.inProgress.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            FASE DE IMPLEMENTACIÓN
          </div>
        </HudCard>

        <HudCard>
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>OBJETIVOS CONCLUIDOS</span>
            <CheckCircle2 className="w-4 h-4 text-hud-green" />
          </div>
          <div className="text-3xl font-bold font-rajdhani text-hud-green">
            {metrics.completed.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            VERIFICADOS Y AUDITADOS
          </div>
        </HudCard>
      </div>

      {/* Barra de Filtros, Búsqueda y Control de Vista */}
      <HudCard className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Buscador táctico */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por título, detalles o proyecto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 pl-9 pr-3.5 py-1.5 font-mono text-xs focus:outline-none focus:border-hud-cyan placeholder:text-slate-600"
            />
          </div>

          {/* Selector de Vista (Kanban / Lista) y Alta Rápida */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-panel-border/40 bg-[#070b12] p-0.5">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1 font-mono text-xs transition-colors ${
                  viewMode === "kanban"
                    ? "bg-hud-cyan/15 text-hud-cyan font-semibold border border-hud-cyan/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>KANBAN</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1 font-mono text-xs transition-colors ${
                  viewMode === "list"
                    ? "bg-hud-cyan/15 text-hud-cyan font-semibold border border-hud-cyan/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>LISTA</span>
              </button>
            </div>

            <CreateTaskModal projects={projects} />
          </div>
        </div>

        {/* Desplegables de Filtrado */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-panel-border/20 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-hud-cyan" />
            <span className="text-slate-400">PROYECTO:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-[#070b12] text-slate-200 border border-panel-border/40 px-2.5 py-1 focus:outline-none focus:border-hud-cyan text-xs"
            >
              <option value="all">TODOS LOS PROYECTOS ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">PRIORIDAD:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-[#070b12] text-slate-200 border border-panel-border/40 px-2.5 py-1 focus:outline-none focus:border-hud-cyan text-xs"
            >
              <option value="all">TODAS LAS PRIORIDADES</option>
              <option value="p1">P1 // CRÍTICO</option>
              <option value="p2">P2 // ALTO</option>
              <option value="p3">P3 // MEDIO</option>
              <option value="p4">P4 // BAJO</option>
            </select>
          </div>

          <div className="ml-auto text-slate-500 text-[11px]">
            MOSTRANDO {filteredTasks.length} DE {initialTasks.length} TAREAS
          </div>
        </div>
      </HudCard>

      {/* Renderizado de Vistas: Kanban vs Lista */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {KANBAN_COLUMNS.map((column) => {
            const ColumnIcon = column.icon;
            const columnTasks = filteredTasks.filter((t) => t.status === column.id);

            return (
              <div
                key={column.id}
                className="bg-[#0a0f1d]/80 border border-panel-border/40 flex flex-col min-h-[500px]"
              >
                {/* Cabecera de Columna Táctica */}
                <div className="px-4 py-3 border-b border-panel-border/30 bg-[#070b13] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ColumnIcon className="w-4 h-4 text-hud-cyan" />
                    <h3 className="font-rajdhani font-bold text-base text-white tracking-wider">
                      {column.label}
                    </h3>
                  </div>
                  <HudBadge variant={column.badgeVariant}>
                    {columnTasks.length}
                  </HudBadge>
                </div>

                {/* Lista de Tareas en Columna */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
                  {columnTasks.length === 0 ? (
                    <div className="p-6 text-center font-mono text-xs text-slate-600 border border-dashed border-panel-border/20">
                      SIN TAREAS EN ESTE ESTADO
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} viewMode="kanban" />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista de Lista Consolidada */
        <HudCard className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-panel-border/30 flex items-center justify-between">
            <h3 className="font-rajdhani font-bold text-lg text-white">
              VISTA CONSOLIDADA DE TAREAS
            </h3>
            <span className="font-mono text-xs text-slate-400">
              TOTAL: {filteredTasks.length}
            </span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-slate-500">
              NO SE ENCONTRARON TAREAS CON LOS FILTROS ACTUALES.
            </div>
          ) : (
            <div className="divide-y divide-panel-border/20 p-2 space-y-2">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} viewMode="list" />
              ))}
            </div>
          )}
        </HudCard>
      )}
    </div>
  );
}
