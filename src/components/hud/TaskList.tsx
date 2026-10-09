"use client";

import React, { useTransition } from "react";
import { updateTaskStatusAction } from "@/app/actions";
import { HudBadge } from "@/components/hud/HudBadge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: "p1" | "p2" | "p3" | "p4";
  status: "backlog" | "in_progress" | "review" | "done";
}

export function TaskList({ tasks }: { tasks: TaskItem[] }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (task: TaskItem) => {
    const nextStatus = task.status === "done" ? "backlog" : "done";
    startTransition(async () => {
      await updateTaskStatusAction(task.id, nextStatus);
    });
  };

  const priorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "p1":
        return "magenta";
      case "p2":
        return "yellow";
      case "p3":
        return "cyan";
      default:
        return "muted";
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center font-mono text-xs text-slate-500">
        NO SE DETECTAN TAREAS EN ESTE SPRINT.
      </div>
    );
  }

  return (
    <div className={cn("divide-y divide-panel-border/20 font-mono text-xs", isPending && "opacity-60")}>
      {tasks.map((task) => {
        const isDone = task.status === "done";
        return (
          <div
            key={task.id}
            className="p-3.5 flex items-center justify-between hover:bg-panel-light/40 transition-colors gap-3"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggle(task)}
                className="text-slate-400 hover:text-hud-cyan transition-colors"
                title={isDone ? "Marcar como pendiente" : "Marcar como completado"}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-hud-green" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </button>
              <div>
                <p className={cn("text-slate-200 font-medium", isDone && "line-through text-slate-500")}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <HudBadge variant={priorityBadgeVariant(task.priority)}>
                {task.priority.toUpperCase()}
              </HudBadge>
              <span className="text-[10px] uppercase text-slate-500">
                {task.status.replace("_", " ")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
