"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HudCard } from "@/components/hud/HudCard";
import { HudButton } from "@/components/hud/HudButton";
import { HudInput } from "@/components/hud/HudInput";
import { createServiceAction } from "@/app/actions";
import { Plus, X, Network } from "lucide-react";

interface CreateServiceModalProps {
  projectId: string;
  nodes: Array<{ id: string; name: string; hostIp: string }>;
}

export function CreateServiceModal({ projectId, nodes }: CreateServiceModalProps) {
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
    const result = await createServiceAction(formData);

    setIsLoading(false);
    if (!result.success) {
      setError(result.message || "Error al registrar el servicio.");
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <HudButton variant="secondary" onClick={() => setIsOpen(true)} className="flex items-center gap-1.5">
        <Plus className="w-3.5 h-3.5" />
        <span>VINCULAR PUERTO / SERVICIO</span>
      </HudButton>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <HudCard className="w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border/30 pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-hud-cyan" />
                <h3 className="font-rajdhani font-bold text-lg text-white">
                  ASIGNAR PUERTO / SERVICIO TÁCTICO
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
              <input type="hidden" name="projectId" value={projectId} />

              <div>
                <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                  NODO HOST
                </label>
                <select
                  name="nodeId"
                  className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-3.5 py-2 font-mono text-sm focus:outline-none focus:border-hud-cyan"
                  required
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.hostIp})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <HudInput
                  name="port"
                  type="number"
                  label="Puerto Externo"
                  placeholder="ej. 8080"
                  required
                />
                <HudInput
                  name="internalPort"
                  type="number"
                  label="Puerto Interno"
                  placeholder="ej. 3000"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                    PROTOCOLO
                  </label>
                  <select
                    name="protocol"
                    defaultValue="http"
                    className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-3.5 py-2 font-mono text-sm focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                    TIPO DE RUNTIME
                  </label>
                  <select
                    name="serviceType"
                    defaultValue="systemd"
                    className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-3.5 py-2 font-mono text-sm focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="systemd">SYSTEMD</option>
                    <option value="caddy">CADDY</option>
                    <option value="uvicorn">UVICORN</option>
                    <option value="container">CONTAINER</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-panel-border/30">
                <HudButton type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  CANCELAR
                </HudButton>
                <HudButton type="submit" variant="primary" isLoading={isLoading}>
                  MAPEAR PUERTO
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
