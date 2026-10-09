"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HudCard } from "@/components/hud/HudCard";
import { HudButton } from "@/components/hud/HudButton";
import { HudInput } from "@/components/hud/HudInput";
import { createTaskAction } from "@/app/actions";
import { Plus, X, ListPlus, AlertTriangle } from "lucide-react";

interface CreateTaskModalProps {
  projects: Array<{ id: string; name: string }>;
  defaultProjectId?: string;
  defaultStatus?: "backlog" | "in_progress" | "review" | "done";
}

export function CreateTaskModal({
  projects,
  defaultProjectId,
  defaultStatus = "backlog",
}: CreateTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createTaskAction(formData);

    setIsLoading(false);
    if (!result.success) {
      setError(result.message || "Error al registrar la tarea.");
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <HudButton
        variant="primary"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        <span>NUEVA TAREA // SPRINT</span>
      </HudButton>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <HudCard className="w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border/30 pb-3">
              <div className="flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-hud-cyan animate-pulse" />
                <h3 className="font-rajdhani font-bold text-lg text-white">
                  INGRESAR TAREA TÁCTICA AL SPRINT
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-hud-magenta/10 border border-hud-magenta/40 text-xs font-mono text-hud-magenta flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                  PROYECTO ASOCIADO
                </label>
                <select
                  name="projectId"
                  defaultValue={defaultProjectId || projects[0]?.id}
                  className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-3.5 py-2 font-mono text-sm focus:outline-none focus:border-hud-cyan"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <HudInput
                  name="title"
                  label="Título de la Tarea"
                  placeholder="ej. Configurar reverse proxy SSL con Caddy"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
                  Detalles / Especificaciones Técnicas
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 p-2.5 font-mono text-xs focus:outline-none focus:border-hud-cyan"
                  placeholder="Instrucciones, puertos o dependencias bloqueantes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                    PRIORIDAD
                  </label>
                  <select
                    name="priority"
                    defaultValue="p3"
                    className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-3 py-2 font-mono text-xs focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="p1">P1 // CRÍTICO (Bloqueante)</option>
                    <option value="p2">P2 // ALTO</option>
                    <option value="p3">P3 // MEDIO</option>
                    <option value="p4">P4 // BAJO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                    ESTADO INICIAL
                  </label>
                  <select
                    name="status"
                    defaultValue={defaultStatus}
                    className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-3 py-2 font-mono text-xs focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="backlog">BACKLOG</option>
                    <option value="in_progress">IN PROGRESS</option>
                    <option value="review">REVIEW</option>
                    <option value="done">DONE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-panel-border/30">
                <HudButton type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  CANCELAR
                </HudButton>
                <HudButton type="submit" variant="primary" isLoading={isLoading}>
                  ASIGNAR TAREA
                </HudButton>
              </div>
            </form>
          </HudCard>
        </div>,
        document.body
      )}
    </>
  );
}
