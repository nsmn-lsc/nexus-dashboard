"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HudCard } from "@/components/hud/HudCard";
import { HudButton } from "@/components/hud/HudButton";
import { HudInput } from "@/components/hud/HudInput";
import { createProjectAction } from "@/app/actions";
import { Plus, X, FolderPlus } from "lucide-react";

export function CreateProjectModal() {
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
    const result = await createProjectAction(formData);

    setIsLoading(false);
    if (!result.success) {
      setError(result.message || "Error al registrar el proyecto.");
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <HudButton variant="primary" onClick={() => setIsOpen(true)} className="flex items-center gap-1.5">
        <Plus className="w-4 h-4" />
        <span>NUEVO PROYECTO</span>
      </HudButton>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <HudCard className="w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border/30 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-hud-cyan" />
                <h3 className="font-rajdhani font-bold text-lg text-white">
                  REGISTRAR NUEVO PROYECTO
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
              <div className="grid grid-cols-2 gap-3">
                <HudInput
                  name="name"
                  label="Nombre del Proyecto"
                  placeholder="ej. Nexus Bot"
                  required
                />
                <HudInput
                  name="slug"
                  label="Slug Único"
                  placeholder="ej. nexus-bot"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
                  Descripción
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 p-2.5 font-mono text-xs focus:outline-none focus:border-hud-cyan"
                  placeholder="Objetivo y detalles del proyecto"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-hud-cyan uppercase mb-1.5">
                    STACK / TECH
                  </label>
                  <select
                    name="framework"
                    defaultValue="django"
                    className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-2.5 py-2 font-mono text-xs focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="django">DJANGO (PY)</option>
                    <option value="fastapi">FASTAPI (PY)</option>
                    <option value="node">NODE / NEXT</option>
                    <option value="docker">DOCKER</option>
                    <option value="generic">GENÉRICO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                    TIPO
                  </label>
                  <select
                    name="type"
                    defaultValue="personal"
                    className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-2.5 py-2 font-mono text-xs focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="laboral">LABORAL</option>
                    <option value="personal">PERSONAL</option>
                    <option value="infra">INFRA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                    ESTADO
                  </label>
                  <select
                    name="status"
                    defaultValue="active"
                    className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-2.5 py-2 font-mono text-xs focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="maintenance">MAINT</option>
                    <option value="paused">PAUSED</option>
                  </select>
                </div>

                <HudInput
                  name="defaultBranch"
                  label="RAMA BASE"
                  defaultValue="main"
                  required
                />
              </div>

              <HudInput
                name="repoUrl"
                label="URL del Repositorio (Opcional)"
                placeholder="https://github.com/..."
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-panel-border/30">
                <HudButton type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  CANCELAR
                </HudButton>
                <HudButton type="submit" variant="primary" isLoading={isLoading}>
                  CREAR PROYECTO
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
