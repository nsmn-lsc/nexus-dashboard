"use client";

import React, { useState, useMemo } from "react";
import { HudCard } from "@/components/hud/HudCard";
import { HudBadge } from "@/components/hud/HudBadge";
import { NodeCard, NodeItem } from "./NodeCard";
import { CreateNodeModal } from "./CreateNodeModal";
import { 
  Server, 
  Search, 
  Filter, 
  Network, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  Cpu
} from "lucide-react";

interface NodesClientProps {
  initialNodes: NodeItem[];
}

export function NodesClient({ initialNodes }: NodesClientProps) {
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>(" ");

  // Filtrado reactivo en vivo
  const filteredNodes = useMemo(() => {
    return initialNodes.filter((node) => {
      if (selectedRole !== "all" && node.role !== selectedRole) return false;
      if (selectedStatus !== "all" && node.status !== selectedStatus) return false;
      if (selectedProvider !== "all" && node.provider !== selectedProvider) return false;

      if (searchQuery.trim() !== "") {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = node.name.toLowerCase().includes(query);
        const matchesHostIp = node.hostIp.toLowerCase().includes(query);
        const matchesPrivateIp = node.privateIp?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesHostIp && !matchesPrivateIp) {
          return false;
        }
      }
      return true;
    });
  }, [initialNodes, selectedRole, selectedStatus, selectedProvider, searchQuery]);

  // Telemetría HUD
  const metrics = useMemo(() => {
    const total = initialNodes.length;
    const online = initialNodes.filter((n) => n.status === "online").length;
    const standby = initialNodes.filter((n) => n.status === "unreachable").length;
    const offline = initialNodes.filter((n) => n.status === "offline").length;
    const totalServices = initialNodes.reduce((acc, n) => acc + n.services.length, 0);
    return { total, online, standby, offline, totalServices };
  }, [initialNodes]);

  return (
    <div className="space-y-6">
      {/* Telemetría Superior HUD de Infraestructura */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HudCard>
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>TOTAL SERVIDORES</span>
            <Server className="w-4 h-4 text-hud-cyan" />
          </div>
          <div className="text-3xl font-bold font-rajdhani text-white">
            {metrics.total.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            HETZNER CLOUD & DEVBOX
          </div>
        </HudCard>

        <HudCard>
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>NODOS EN LÍNEA // ONLINE</span>
            <Activity className="w-4 h-4 text-hud-green" />
          </div>
          <div className="text-3xl font-bold font-rajdhani text-hud-green">
            {metrics.online.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            100% OPERACIONALES
          </div>
        </HudCard>

        <HudCard variant={metrics.offline > 0 ? "danger" : "default"}>
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>ALERTAS // SUSPENDIDOS</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.offline > 0 ? "text-hud-magenta animate-pulse" : "text-slate-500"}`} />
          </div>
          <div className={`text-3xl font-bold font-rajdhani ${metrics.offline > 0 ? "text-hud-magenta" : "text-slate-300"}`}>
            {metrics.offline.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            {metrics.offline > 0 ? "NODOS FUERA DE SERVICIO" : "SIN CAÍDAS DE RED"}
          </div>
        </HudCard>

        <HudCard>
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>SERVICIOS ALOJADOS</span>
            <Network className="w-4 h-4 text-hud-yellow" />
          </div>
          <div className="text-3xl font-bold font-rajdhani text-hud-yellow">
            {metrics.totalServices.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            PUERTOS Y PROCESOS MAPEADOS
          </div>
        </HudCard>
      </div>

      {/* Barra de Filtros Tácticos y Búsqueda */}
      <HudCard className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Buscador de Servidor */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, IPv4 o IP privada..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070b12] text-slate-200 border border-panel-border/40 pl-9 pr-3.5 py-1.5 font-mono text-xs focus:outline-none focus:border-hud-cyan placeholder:text-slate-600"
            />
          </div>

          <CreateNodeModal />
        </div>

        {/* Desplegables de Filtrado */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-panel-border/20 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-hud-cyan" />
            <span className="text-slate-400">ROL:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-[#070b12] text-slate-200 border border-panel-border/40 px-2.5 py-1 focus:outline-none focus:border-hud-cyan text-xs"
            >
              <option value="all">TODOS LOS ROLES</option>
              <option value="app">APP / REVERSE PROXY</option>
              <option value="db">DATABASE SYSTEMD</option>
              <option value="storage">STORAGE / BACKUPS</option>
              <option value="local">LOCAL DEVBOX</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">ESTADO:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#070b12] text-slate-200 border border-panel-border/40 px-2.5 py-1 focus:outline-none focus:border-hud-cyan text-xs"
            >
              <option value="all">TODOS LOS ESTADOS</option>
              <option value="online">ONLINE</option>
              <option value="offline">OFFLINE</option>
              <option value="unreachable">STANDBY / UNREACHABLE</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">PROVEEDOR:</span>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-[#070b12] text-slate-200 border border-panel-border/40 px-2.5 py-1 focus:outline-none focus:border-hud-cyan text-xs"
            >
              <option value="all">TODOS</option>
              <option value="hetzner">HETZNER CLOUD</option>
              <option value="local">LOCAL SERVER</option>
            </select>
          </div>

          <div className="ml-auto text-slate-500 text-[11px]">
            MOSTRANDO {filteredNodes.length} DE {initialNodes.length} NODOS
          </div>
        </div>
      </HudCard>

      {/* Grid de Tarjetas Tácticas de Servidores */}
      {filteredNodes.length === 0 ? (
        <HudCard className="p-12 text-center font-mono text-xs text-slate-500">
          NO HAY NODOS DE INFRAESTRUCTURA QUE COINCIDAN CON LOS FILTROS.
        </HudCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {filteredNodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
      )}
    </div>
  );
}
