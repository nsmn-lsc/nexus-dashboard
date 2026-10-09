"use client";

import React, { useState } from "react";
import { HudCard } from "@/components/hud/HudCard";
import { HudButton } from "@/components/hud/HudButton";
import { HudInput } from "@/components/hud/HudInput";
import { createDevlogAction } from "@/app/actions";
import { Plus, X, FileEdit } from "lucide-react";

interface CreateDevlogModalProps {
  projects: Array<{ id: string; name: string }>;
  defaultProjectId?: string;
}

export function CreateDevlogModal({ projects, defaultProjectId }: CreateDevlogModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createDevlogAction(formData);

    setIsLoading(false);
    if (!result.success) {
      setError(result.message || "Error al registrar la bitácora.");
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <HudButton variant="primary" onClick={() => setIsOpen(true)} className="flex items-center gap-1.5">
        <Plus className="w-4 h-4" />
        <span>NUEVA BITÁCORA</span>
      </HudButton>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <HudCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border/30 pb-3">
              <div className="flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-hud-cyan" />
                <h3 className="font-rajdhani font-bold text-lg text-white">
                  REGISTRAR BITÁCORA DE INGENIERÍA // DEVLOG
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
              <div className="p-3 bg-hud-magenta/10 border border-hud-magenta/40 text-xs font-mono text-hud-magenta">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                  PROYECTO OBJETIVO
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
                  label="Título de la Nota / Incidencia"
                  placeholder="ej. Migración de esquema PostgreSQL en nodo DB-01"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
                  Contenido Markdown (Admite bloques de código ```bash, ```sql, etc.)
                </label>
                <textarea
                  name="markdownContent"
                  rows={8}
                  className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 p-3 font-mono text-xs focus:outline-none focus:border-hud-cyan focus:ring-1 focus:ring-hud-cyan/50"
                  placeholder="### Resumen Técnico&#10;- Se actualizaron las variables de entorno...&#10;&#10;```bash&#10;systemctl restart postgresql&#10;```"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-panel-border/30">
                <HudButton type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  CANCELAR
                </HudButton>
                <HudButton type="submit" variant="primary" isLoading={isLoading}>
                  GUARDAR BITÁCORA
                </HudButton>
              </div>
            </form>
          </HudCard>
        </div>
      )}
    </>
  );
}
