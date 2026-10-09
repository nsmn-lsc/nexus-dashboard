"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HudCard } from "@/components/hud/HudCard";
import { HudButton } from "@/components/hud/HudButton";
import { HudInput } from "@/components/hud/HudInput";
import { createWebhookEndpointAction } from "@/app/actions";
import { Plus, X, Radio, RefreshCw, Copy, Check } from "lucide-react";

const AVAILABLE_EVENTS = [
  { id: "service.status_change", label: "service.status_change (Cambio estado de puerto/servicio)" },
  { id: "deploy.finished", label: "deploy.finished (Despliegue finalizado)" },
  { id: "task.created", label: "task.created (Nueva tarea creada)" },
  { id: "devlog.entry", label: "devlog.entry (Nueva entrada de bitácora)" },
  { id: "backup.alert", label: "backup.alert (Alerta de respaldo Hetzner)" },
  { id: "*", label: "* (Todos los eventos)" },
];

export function CreateWebhookModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"inbound" | "outbound">("outbound");
  const [secret, setSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const generateSecret = () => {
    // Generar string pseudo-aleatorio hex de 48 caracteres en cliente
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    const hex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    setSecret(hex);
  };

  const handleOpen = () => {
    generateSecret();
    setIsOpen(true);
  };

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("secret", secret);
    formData.set("isActive", "true");

    const result = await createWebhookEndpointAction(formData);

    setIsLoading(false);
    if (!result.success) {
      setError(result.message || "Error al registrar el webhook.");
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <HudButton variant="primary" onClick={handleOpen} className="flex items-center gap-1.5">
        <Plus className="w-4 h-4" />
        <span>NUEVO ENDPOINT WEBHOOK</span>
      </HudButton>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <HudCard className="w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border/30 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-hud-cyan animate-pulse" />
                <h3 className="font-rajdhani font-bold text-lg text-white">
                  CONFIGURAR INTEGRACIÓN DE EVENTOS // WEBHOOK
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
                  label="Nombre del Endpoint"
                  placeholder="ej. Telegram Bot Alert"
                  required
                />
                <div>
                  <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                    DIRECCIÓN DEL ENLACE
                  </label>
                  <select
                    name="type"
                    value={type}
                    onChange={(e) => setType(e.target.value as "inbound" | "outbound")}
                    className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 px-3 py-2 font-mono text-sm focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="outbound">OUTBOUND (Hacia API/Telegram/Discord)</option>
                    <option value="inbound">INBOUND (Recibir de Git/Hetzner/Agentes)</option>
                  </select>
                </div>
              </div>

              <div>
                <HudInput
                  name="url"
                  label={
                    type === "outbound"
                      ? "URL Destino (o endpoint de Telegram)"
                      : "Slug Inbound Único (/api/webhooks/[slug])"
                  }
                  placeholder={
                    type === "outbound"
                      ? "https://api.telegram.org/bot<TOKEN>/sendMessage"
                      : "hetzner-agent-node01"
                  }
                  required
                />
              </div>

              {/* Secret Criptográfico HMAC */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
                    CLAVE SECRETA HMAC SHA-256
                  </label>
                  <button
                    type="button"
                    onClick={generateSecret}
                    className="flex items-center gap-1 text-[11px] text-hud-cyan hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>REGENERAR</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={secret}
                    readOnly
                    className="flex-1 bg-[#070b12] text-slate-300 border border-panel-border/40 px-3 py-2 font-mono text-xs tracking-wider select-all focus:outline-none focus:border-hud-cyan"
                  />
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="p-2 border border-panel-border/40 bg-panel-light text-slate-300 hover:text-hud-cyan transition-colors"
                    title="Copiar Secret"
                  >
                    {copiedSecret ? (
                      <Check className="w-4 h-4 text-hud-green" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Usa esta clave en los headers <code>X-Nexus-Signature: sha256=...</code>
                </p>
              </div>

              {/* Eventos Suscritos */}
              <div className="space-y-2 pt-2 border-t border-panel-border/20">
                <label className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
                  EVENTOS SUSCRITOS
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {AVAILABLE_EVENTS.map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        name="events"
                        value={ev.id}
                        defaultChecked={ev.id === "service.status_change" || ev.id === "deploy.finished"}
                        className="rounded-none bg-[#070b12] border-panel-border/40 text-hud-cyan focus:ring-0"
                      />
                      <span>{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-panel-border/30">
                <HudButton type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  CANCELAR
                </HudButton>
                <HudButton type="submit" variant="primary" isLoading={isLoading}>
                  REGISTRAR WEBHOOK
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
