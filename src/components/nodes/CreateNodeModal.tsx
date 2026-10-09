"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HudCard } from "@/components/hud/HudCard";
import { HudButton } from "@/components/hud/HudButton";
import { HudInput } from "@/components/hud/HudInput";
import { createNodeAction } from "@/app/actions";
import { Plus, X, Server, AlertTriangle } from "lucide-react";

export function CreateNodeModal() {
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
    const result = await createNodeAction(formData);

    setIsLoading(false);
    if (!result.success) {
      setError(result.message || "Error al registrar el nodo.");
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
        <span>VINCULAR NODO // SERVIDOR</span>
      </HudButton>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <HudCard className="w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border/30 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-hud-cyan animate-pulse" />
                <h3 className="font-rajdhani font-bold text-lg text-white">
                  PROVISIONAR NODO EN LA INFRAESTRUCTURA
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
              <div className="grid grid-cols-2 gap-3">
                <HudInput
                  name="name"
                  label="Nombre del Host / Alias"
                  placeholder="ej. hetzner-app-02"
                  required
                />

                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                    PROVEEDOR DE INFRA
                  </label>
                  <select
                    name="provider"
                    defaultValue="hetzner"
                    className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-3 py-2 font-mono text-xs focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="hetzner">HETZNER CLOUD</option>
                    <option value="local">LOCAL SERVER / DEVBOX</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <HudInput
                  name="hostIp"
                  label="IPv4 Pública / FQDN"
                  placeholder="ej. 159.69.120.45"
                  required
                />

                <HudInput
                  name="privateIp"
                  label="VLAN / IP Privada (Opcional)"
                  placeholder="ej. 10.0.1.15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                    ROL PRINCIPAL
                  </label>
                  <select
                    name="role"
                    defaultValue="app"
                    className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-3 py-2 font-mono text-xs focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="app">APP / REVERSE PROXY</option>
                    <option value="db">DATABASE (SYSTEMD / POSTGRES)</option>
                    <option value="storage">STORAGE / BACKUPS</option>
                    <option value="local">LOCAL DEVBOX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                    ESTADO INICIAL
                  </label>
                  <select
                    name="status"
                    defaultValue="online"
                    className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-3 py-2 font-mono text-xs focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="online">ONLINE</option>
                    <option value="offline">OFFLINE</option>
                    <option value="unreachable">STANDBY / UNREACHABLE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-panel-border/30">
                <HudButton type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  CANCELAR
                </HudButton>
                <HudButton type="submit" variant="primary" isLoading={isLoading}>
                  REGISTRAR NODO
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
