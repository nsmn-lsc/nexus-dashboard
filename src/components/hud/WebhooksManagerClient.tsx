"use client";

import React, { useState, useTransition, useMemo } from "react";
import { HudCard } from "@/components/hud/HudCard";
import { HudBadge } from "@/components/hud/HudBadge";
import { HudButton } from "@/components/hud/HudButton";
import { CreateWebhookModal } from "@/components/hud/CreateWebhookModal";
import { 
  toggleWebhookEndpointAction, 
  triggerTestWebhookAction,
  deleteWebhookEndpointAction,
  clearWebhookDeliveriesAction,
} from "@/app/actions";
import { 
  Radio, 
  Send, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);

  // Estados de Paginación y Filtrado Táctico
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [endpointFilter, setEndpointFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Métricas rápidas de entregas
  const successCount = useMemo(
    () => deliveries.filter((d) => d.status === "success").length,
    [deliveries]
  );
  const failedCount = useMemo(
    () => deliveries.filter((d) => d.status === "failed").length,
    [deliveries]
  );

  // Filtrado reactivo en cliente
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((del) => {
      if (statusFilter !== "all" && del.status !== statusFilter) return false;
      if (endpointFilter !== "all" && del.endpointId !== endpointFilter) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchType = del.eventType.toLowerCase().includes(q);
        const matchName = del.endpointName.toLowerCase().includes(q);
        const matchStatus = (del.statusCode?.toString() || "").includes(q);
        if (!matchType && !matchName && !matchStatus) return false;
      }
      return true;
    });
  }, [deliveries, statusFilter, endpointFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDeliveries.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedDeliveries = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredDeliveries.slice(start, start + pageSize);
  }, [filteredDeliveries, safePage, pageSize]);

  const handleStatusFilterChange = (status: "all" | "success" | "failed") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleEndpointFilterChange = (epId: string) => {
    setEndpointFilter(epId);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

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

  const handleDeleteEndpoint = (endpointId: string) => {
    startTransition(async () => {
      await deleteWebhookEndpointAction(endpointId);
      setConfirmDeleteId(null);
    });
  };

  const handleClearDeliveries = () => {
    startTransition(async () => {
      await clearWebhookDeliveriesAction();
      setConfirmClearLogs(false);
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
                <div className="flex items-center gap-2">
                  <HudButton
                    variant="ghost"
                    className="text-xs p-1 hover:text-white"
                    onClick={() => handleToggleActive(ep)}
                    disabled={isPending}
                  >
                    {ep.isActive ? "DESACTIVAR" : "ACTIVAR"}
                  </HudButton>

                  {confirmDeleteId === ep.id ? (
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleDeleteEndpoint(ep.id)}
                        disabled={isPending}
                        className="bg-hud-magenta/20 text-hud-magenta border border-hud-magenta/50 px-2 py-0.5 font-bold hover:bg-hud-magenta hover:text-white transition-colors"
                      >
                        CONFIRMAR
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-slate-400 hover:text-white px-1"
                      >
                        CANCELAR
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(ep.id)}
                      className="p-1 text-slate-500 hover:text-hud-magenta transition-colors"
                      title="Eliminar Endpoint Webhook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

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
        <div className="px-5 py-4 border-b border-panel-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-hud-cyan" />
            <h2 className="font-rajdhani font-bold text-lg text-white">
              AUDIT LOG // HISTORIAL DE ENTREGAS & RECEPCIÓN
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              TOTAL ENTRADAS: {deliveries.length}
            </span>
            {deliveries.length > 0 && (
              confirmClearLogs ? (
                <div className="flex items-center gap-1 font-mono text-xs">
                  <button
                    type="button"
                    onClick={handleClearDeliveries}
                    disabled={isPending}
                    className="bg-hud-magenta/20 text-hud-magenta border border-hud-magenta/50 px-2 py-0.5 font-bold hover:bg-hud-magenta hover:text-white transition-colors"
                  >
                    ¿VACIAR BITÁCORA?
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearLogs(false)}
                    className="text-slate-400 hover:text-white px-1"
                  >
                    CANCELAR
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearLogs(true)}
                  className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-hud-magenta transition-colors px-2 py-0.5 border border-panel-border/30 hover:border-hud-magenta/40"
                  title="Limpiar todas las entregas de prueba"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>LIMPIAR HISTORIAL</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Barra de Filtros Tácticos & Control de Paginación */}
        {deliveries.length > 0 && (
          <div className="bg-[#070b13] px-5 py-3 border-b border-panel-border/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3 font-mono text-xs">
            {/* Buscador y Filtro por Endpoint */}
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar evento, endpoint o HTTP status..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-[#0a0f1d] text-slate-200 border border-panel-border/30 pl-8 pr-2.5 py-1.5 text-xs focus:outline-none focus:border-hud-cyan placeholder:text-slate-600"
                />
              </div>

              {endpoints.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px] hidden sm:inline">ORIGEN:</span>
                  <select
                    value={endpointFilter}
                    onChange={(e) => handleEndpointFilterChange(e.target.value)}
                    className="bg-[#0a0f1d] text-slate-300 border border-panel-border/30 px-2 py-1.5 text-xs focus:outline-none focus:border-hud-cyan"
                  >
                    <option value="all">TODOS LOS ENDPOINTS</option>
                    {endpoints.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Pestañas de Estado & Selector de Densidad */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Botones de Estado */}
              <div className="flex items-center border border-panel-border/30 bg-[#0a0f1d] p-0.5">
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange("all")}
                  className={`px-2.5 py-1 text-[11px] transition-colors ${
                    statusFilter === "all"
                      ? "bg-hud-cyan/20 text-hud-cyan font-bold border border-hud-cyan/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  TODOS ({deliveries.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange("failed")}
                  className={`px-2.5 py-1 text-[11px] transition-colors ${
                    statusFilter === "failed"
                      ? "bg-hud-magenta/20 text-hud-magenta font-bold border border-hud-magenta/40"
                      : "text-slate-400 hover:text-hud-magenta"
                  }`}
                >
                  FALLIDOS ({failedCount})
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange("success")}
                  className={`px-2.5 py-1 text-[11px] transition-colors ${
                    statusFilter === "success"
                      ? "bg-hud-green/20 text-hud-green font-bold border border-hud-green/40"
                      : "text-slate-400 hover:text-hud-green"
                  }`}
                >
                  EXITOSOS ({successCount})
                </button>
              </div>

              {/* Selector de Densidad por Página */}
              <div className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto lg:ml-0">
                <span className="hidden sm:inline">VER:</span>
                {[10, 25, 50].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handlePageSizeChange(size)}
                    className={`px-2 py-0.5 border text-[11px] font-mono transition-colors ${
                      pageSize === size
                        ? "border-hud-cyan text-hud-cyan bg-hud-cyan/15 font-bold shadow-[0_0_8px_rgba(0,243,255,0.2)]"
                        : "border-panel-border/30 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Entregas Paginadas con Scroll HUD Controlado */}
        {deliveries.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-slate-500">
            NO HAY EVENTOS O ENTREGAS REGISTRADAS EN LA BITÁCORA DE WEBHOOKS.
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-slate-500 space-y-1">
            <div className="text-slate-400 font-bold">SIN COINCIDENCIAS</div>
            <div>No se encontraron entregas que coincidan con los filtros aplicados.</div>
          </div>
        ) : (
          <div className="divide-y divide-panel-border/20 font-mono text-xs max-h-[600px] overflow-y-auto">
            {paginatedDeliveries.map((del) => {
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

        {/* Footer Táctico de Paginación */}
        {filteredDeliveries.length > 0 && (
          <div className="bg-[#070b13] px-5 py-3 border-t border-panel-border/20 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-slate-400">
            <div>
              MOSTRANDO{" "}
              <span className="text-white font-bold">
                {(safePage - 1) * pageSize + 1}
              </span>{" "}
              -{" "}
              <span className="text-white font-bold">
                {Math.min(safePage * pageSize, filteredDeliveries.length)}
              </span>{" "}
              DE{" "}
              <span className="text-hud-cyan font-bold">
                {filteredDeliveries.length}
              </span>{" "}
              EVENTOS
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-2.5 py-1 border border-panel-border/40 bg-[#0a0f1d] text-slate-300 hover:border-hud-cyan hover:text-hud-cyan disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>ANTERIOR</span>
              </button>

              <span className="px-3 py-1 bg-[#0a0f1d] border border-panel-border/30 text-slate-300">
                PÁGINA <span className="text-hud-cyan font-bold">{safePage}</span> DE{" "}
                <span className="text-slate-200 font-bold">{totalPages}</span>
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-2.5 py-1 border border-panel-border/40 bg-[#0a0f1d] text-slate-300 hover:border-hud-cyan hover:text-hud-cyan disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
              >
                <span>SIGUIENTE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </HudCard>
    </div>
  );
}
