"use client";

import React, { useState, useTransition } from "react";
import { HudCard } from "@/components/hud/HudCard";
import { HudBadge } from "@/components/hud/HudBadge";
import { HudButton } from "@/components/hud/HudButton";
import { CreateWebhookModal } from "@/components/hud/CreateWebhookModal";
import { toggleWebhookEndpointAction, triggerTestWebhookAction } from "@/app/actions";
import { Radio, Send, Activity, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface EndpointItem {
  id: string;
  name: string;
  type: "inbound" | "outbound";
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: Date;
}

interface DeliveryItem {
  id: string;
  endpointId: string;
  endpointName: string;
  eventType: string;
  payload: Record<string, unknown>;
  statusCode: number | null;
  responseBody: string | null;
  status: "success" | "failed" | "pending";
  executedAt: Date;
}

interface WebhooksManagerClientProps {
  endpoints: EndpointItem[];
  deliveries: DeliveryItem[];
}

export function WebhooksManagerClient({
  endpoints,
  deliveries,
}: WebhooksManagerClientProps) {
  const [isPending, startTransition] = useTransition();
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  const handleToggleActive = (endpoint: EndpointItem) => {
    startTransition(async () => {
      await toggleWebhookEndpointAction(endpoint.id, endpoint.isActive);
    });
  };

  const handleTestPing = (endpointId: string) => {
    startTransition(async () => {
      await triggerTestWebhookAction(endpointId);
    });
  };

  return (
    <div className="space-y-6">
      {/* Barra de Acciones y Resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-panel-border/30 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-rajdhani tracking-wide text-white flex items-center gap-2">
            SUBSISTEMA DE WEBHOOKS // EVENT DISPATCHER
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Control de eventos inbound (agentes/timers) y outbound con firma criptográfica HMAC SHA-256.
          </p>
        </div>
        <CreateWebhookModal />
      </div>

      {/* Grid de Endpoints Configurados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {endpoints.length === 0 ? (
          <HudCard className="col-span-full p-8 text-center font-mono text-xs text-slate-500">
            NO HAY ENDPOINTS DE WEBHOOK REGISTRADOS.
          </HudCard>
        ) : (
          endpoints.map((ep) => (
            <HudCard key={ep.id} className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-hud-cyan uppercase tracking-wider px-2 py-0.5 border border-hud-cyan/30 bg-hud-cyan/10">
                    {ep.type.toUpperCase()}
                  </span>
                  <HudBadge
                    variant={ep.isActive ? "green" : "muted"}
                    pulse={ep.isActive}
                  >
                    {ep.isActive ? "ONLINE" : "STANDBY"}
                  </HudBadge>
                </div>

                <div>
                  <h3 className="text-xl font-bold font-rajdhani text-white">
                    {ep.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-1 truncate">
                    {ep.type === "inbound" ? `/api/webhooks/${ep.url}` : ep.url}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-panel-border/20 font-mono text-[11px] text-slate-400">
                  <div>
                    <span className="text-slate-500">EVENTOS: </span>
                    <span className="text-slate-300">
                      {ep.events.join(", ")}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500">SECRET: </span>
                    <span className="text-slate-400 select-all">
                      {ep.secret.slice(0, 10)}...{ep.secret.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-panel-border/30 flex items-center justify-between gap-2">
                <HudButton
                  variant="ghost"
                  className="text-xs p-1 hover:text-white"
                  onClick={() => handleToggleActive(ep)}
                  disabled={isPending}
                >
                  {ep.isActive ? "DESACTIVAR" : "ACTIVAR"}
                </HudButton>

                <HudButton
                  variant="secondary"
                  className="flex items-center gap-1.5 text-xs py-1.5 px-3"
                  onClick={() => handleTestPing(ep.id)}
                  disabled={isPending}
                >
                  <Send className="w-3 h-3 text-hud-cyan" />
                  <span>TEST PING</span>
                </HudButton>
              </div>
            </HudCard>
          ))
        )}
      </div>

      {/* Log de Auditoría e Historial de Entregas */}
      <HudCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-panel-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-hud-cyan" />
            <h2 className="font-rajdhani font-bold text-lg text-white">
              AUDIT LOG // HISTORIAL DE ENTREGAS & RECEPCIÓN
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            TOTAL ENTRADAS: {deliveries.length}
          </span>
        </div>

        {deliveries.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-slate-500">
            NO HAY EVENTOS O ENTREGAS REGISTRADAS EN LA BITÁCORA DE WEBHOOKS.
          </div>
        ) : (
          <div className="divide-y divide-panel-border/20 font-mono text-xs">
            {deliveries.map((del) => {
              const isExpanded = expandedDeliveryId === del.id;
              const isSuccess = del.status === "success";

              return (
                <div key={del.id} className="hover:bg-panel-light/30 transition-colors">
                  <div
                    onClick={() => setExpandedDeliveryId(isExpanded ? null : del.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {isSuccess ? (
                        <CheckCircle2 className="w-4 h-4 text-hud-green shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-hud-magenta shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{del.eventType}</span>
                          <span className="text-slate-500">➔ {del.endpointName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(del.executedAt).toISOString().replace("T", " ").slice(0, 19)} UTC
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <HudBadge variant={isSuccess ? "green" : "magenta"}>
                        {del.statusCode ? `HTTP ${del.statusCode}` : del.status.toUpperCase()}
                      </HudBadge>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-[#05080e] border-t border-panel-border/20 space-y-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                          PAYLOAD DEL EVENTO (JSON):
                        </div>
                        <pre className="p-3 bg-[#0a0f1d] border border-panel-border/30 overflow-x-auto text-[11px] text-hud-cyan font-mono">
                          {JSON.stringify(del.payload, null, 2)}
                        </pre>
                      </div>

                      {del.responseBody && (
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                            RESPUESTA DEL SERVIDOR / AGENTE:
                          </div>
                          <pre className="p-3 bg-[#0a0f1d] border border-panel-border/30 overflow-x-auto text-[11px] text-slate-300 font-mono">
                            {del.responseBody}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </HudCard>
    </div>
  );
}
