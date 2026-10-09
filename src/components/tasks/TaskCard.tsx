"use client";

import React, { useTransition } from "react";
import { HudCard } from "@/components/hud/HudCard";
import { HudBadge } from "@/components/hud/HudBadge";
import { updateTaskStatusAction, deleteTaskAction } from "@/app/actions";
import { 
  ChevronRight, 
  ChevronLeft, 
  Trash2, 
  FolderGit2, 
  Clock, 
  AlertOctagon,
  CheckCircle2,
  CircleDot
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TaskItem {
  id: string;
  projectId: string;
  projectName: string;
  projectSlug: string;
  title: string;
  description: string | null;
  priority: "p1" | "p2" | "p3" | "p4";
  status: "backlog" | "in_progress" | "review" | "done";
  createdAt: Date;
}

const STATUS_ORDER: Array<TaskItem["status"]> = ["backlog", "in_progress", "review", "done"];

interface TaskCardProps {
  task: TaskItem;
  viewMode?: "kanban" | "list";
}

export function TaskCard({ task, viewMode = "kanban" }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();

  const currentIndex = STATUS_ORDER.indexOf(task.status);
  const prevStatus = currentIndex > 0 ? STATUS_ORDER[currentIndex - 1] : null;
  const nextStatus = currentIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIndex + 1] : null;

  const handleMove = (newStatus: TaskItem["status"]) => {
    startTransition(async () => {
      await updateTaskStatusAction(task.id, newStatus);
    });
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar la tarea "${task.title}" del centro táctico?`)) {
      startTransition(async () => {
        await deleteTaskAction(task.id);
      });
    }
  };

  const getPriorityBadge = (priority: TaskItem["priority"]) => {
    switch (priority) {
      case "p1":
        return (
          <HudBadge variant="magenta" pulse className="font-bold border-hud-magenta/60">
            <span className="flex items-center gap-1">
              <AlertOctagon className="w-3 h-3 text-hud-magenta" />
              P1 // CRÍTICO
            </span>
          </HudBadge>
        );
      case "p2":
        return (
          <HudBadge variant="yellow" className="border-hud-yellow/50">
            P2 // ALTO
          </HudBadge>
        );
      case "p3":
        return (
          <HudBadge variant="cyan" className="border-hud-cyan/40">
            P3 // MEDIO
          </HudBadge>
        );
      case "p4":
      default:
        return (
          <HudBadge variant="muted">
            P4 // BAJO
          </HudBadge>
        );
    }
  };

  const isKanban = viewMode === "kanban";

  return (
    <HudCard
      className={cn(
        "p-3.5 space-y-3 transition-all duration-200 hover:border-hud-cyan/60 group",
        isPending && "opacity-50 pointer-events-none",
        task.priority === "p1" && "border-l-2 border-l-hud-magenta bg-hud-magenta/[0.03]"
      )}
    >
      {/* Encabezado: Prioridad y Proyecto */}
      <div className="flex items-center justify-between gap-2">
        {getPriorityBadge(task.priority)}

        <Link
          href={`/dashboard/projects/${task.projectSlug}`}
          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-hud-cyan transition-colors truncate max-w-[150px]"
          title={task.projectName}
        >
          <FolderGit2 className="w-3 h-3 shrink-0 text-hud-cyan/80" />
          <span className="truncate">{task.projectName}</span>
        </Link>
      </div>

      {/* Título y Descripción */}
      <div className="space-y-1">
        <h4 className="font-rajdhani font-bold text-base text-white tracking-wide leading-tight group-hover:text-hud-cyan transition-colors">
          {task.title}
        </h4>
        {task.description && (
          <p className="font-mono text-xs text-slate-400 line-clamp-3 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer Táctico con Acciones en 1 Clic */}
      <div className="pt-2 border-t border-panel-border/30 flex items-center justify-between font-mono text-[11px]">
        {/* Fecha y estado en modo Lista */}
        <div className="flex items-center gap-2 text-slate-500">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>
            {new Date(task.createdAt).toISOString().slice(5, 10)}
          </span>
          {!isKanban && (
            <span className="uppercase px-1.5 py-0.5 border border-panel-border/30 bg-[#070b13] text-hud-cyan text-[10px]">
              {task.status.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Botones de Transición Táctica */}
        <div className="flex items-center gap-1">
          {prevStatus && (
            <button
              onClick={() => handleMove(prevStatus)}
              className="p-1 text-slate-400 hover:text-hud-yellow hover:bg-hud-yellow/10 border border-panel-border/20 transition-colors"
              title={`Retroceder a ${prevStatus.replace("_", " ")}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {nextStatus && (
            <button
              onClick={() => handleMove(nextStatus)}
              className="p-1 text-slate-400 hover:text-hud-cyan hover:bg-hud-cyan/10 border border-panel-border/20 transition-colors"
              title={`Avanzar a ${nextStatus.replace("_", " ")}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {task.status === "done" && (
            <span className="p-1 text-hud-green" title="Completada">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          )}

          <button
            onClick={handleDelete}
            className="p-1 text-slate-500 hover:text-hud-magenta hover:bg-hud-magenta/10 border border-transparent hover:border-hud-magenta/30 transition-colors ml-1"
            title="Eliminar tarea"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </HudCard>
  );
}
