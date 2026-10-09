"use client";

import React, { useTransition } from "react";
import { HudCard } from "@/components/hud/HudCard";
import { HudBadge } from "@/components/hud/HudBadge";
import { CopyCommand } from "@/components/hud/CopyCommand";
import { updateNodeStatusAction, deleteNodeAction } from "@/app/actions";
import { 
  Server, 
  Cpu, 
  Network, 
  Terminal, 
  Trash2, 
  Power, 
  Activity,
  Layers,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NodeServiceItem {
  id: string;
  projectId: string;
  projectName: string;
  projectSlug: string;
  port: number;
  internalPort: number | null;
  protocol: string;
  serviceType: string;
  status: "running" | "stopped" | "failed";
}

export interface NodeItem {
  id: string;
  name: string;
  hostIp: string;
  privateIp: string | null;
  role: "app" | "db" | "storage" | "local";
  provider: "hetzner" | "local";
  status: "online" | "offline" | "unreachable";
  services: NodeServiceItem[];
}

interface NodeCardProps {
  node: NodeItem;
}

export function NodeCard({ node }: NodeCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusToggle = () => {
    const nextStatus = node.status === "online" ? "offline" : "online";
    startTransition(async () => {
      await updateNodeStatusAction(node.id, nextStatus);
    });
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar el nodo de infraestructura "${node.name}" (${node.hostIp})?`)) {
      startTransition(async () => {
        await deleteNodeAction(node.id);
      });
    }
  };

  const getStatusBadge = (status: NodeItem["status"]) => {
    switch (status) {
      case "online":
        return (
          <HudBadge variant="green" pulse>
            ONLINE
          </HudBadge>
        );
      case "unreachable":
        return (
          <HudBadge variant="yellow" pulse>
            STANDBY / UNREACHABLE
          </HudBadge>
        );
      case "offline":
      default:
        return (
          <HudBadge variant="magenta">
            OFFLINE
          </HudBadge>
        );
    }
  };

  const getRoleLabel = (role: NodeItem["role"]) => {
    switch (role) {
      case "app":
        return "App / Reverse Proxy";
      case "db":
        return "Database Systemd";
      case "storage":
        return "Storage / Backups";
      case "local":
      default:
        return "Local DevBox";
    }
  };

  const sshCommand = `ssh root@${node.hostIp}`;

  return (
    <HudCard
      className={cn(
        "flex flex-col justify-between space-y-4 transition-all duration-200 hover:border-hud-cyan/60",
        node.status === "offline" && "border-hud-magenta/30",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      <div className="space-y-3.5">
        {/* Cabecera del Servidor: Nombre, Proveedor y Estado */}
        <div className="flex items-start justify-between gap-3 border-b border-panel-border/30 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Server className={cn("w-4 h-4", node.status === "online" ? "text-hud-cyan" : "text-slate-500")} />
              <h3 className="font-rajdhani font-bold text-xl text-white tracking-wide">
                {node.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="uppercase px-1.5 py-0.5 border border-panel-border/40 bg-[#070b13] text-hud-cyan">
                {node.provider === "hetzner" ? "HETZNER CLOUD" : "LOCAL SERVER"}
              </span>
              <span>•</span>
              <span className="text-slate-300 font-semibold">{getRoleLabel(node.role)}</span>
            </div>
          </div>

          <div className="shrink-0">
            {getStatusBadge(node.status)}
          </div>
        </div>

        {/* Bloque de Red e IPs (1-Clic para Copiar) */}
        <div className="grid grid-cols-1 gap-2">
          <CopyCommand
            label="IPv4 Pública / Enlace Host"
            command={node.hostIp}
          />
          {node.privateIp && (
            <CopyCommand
              label="Red Privada / VLAN Interna Hetzner"
              command={node.privateIp}
            />
          )}
          <CopyCommand
            label="Acceso Táctico SSH"
            command={sshCommand}
          />
        </div>

        {/* Lista de Servicios y Procesos Activos en este Nodo */}
        <div className="space-y-2 pt-2 border-t border-panel-border/20">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Network className="w-3.5 h-3.5 text-hud-cyan" />
              <span>SERVICIOS ACTIVOS ({node.services.length}):</span>
            </span>
            <span className="text-slate-500 text-[10px]">MAPEOS ASIGNADOS</span>
          </div>

          {node.services.length === 0 ? (
            <div className="p-3 text-center font-mono text-[11px] text-slate-600 border border-dashed border-panel-border/20">
              SIN SERVICIOS VINCULADOS A ESTE NODO
            </div>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {node.services.map((srv) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between p-2 bg-[#070b13] border border-panel-border/30 font-mono text-xs hover:border-hud-cyan/40 transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-bold text-hud-cyan">
                      :{srv.port}
                    </span>
                    <span className="text-slate-500 uppercase text-[10px]">
                      {srv.protocol}
                    </span>
                    <Link
                      href={`/dashboard/projects/${srv.projectSlug}`}
                      className="text-slate-300 hover:text-white hover:underline truncate text-[11px]"
                      title={srv.projectName}
                    >
                      {srv.projectName}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase text-slate-400 border border-panel-border/40 px-1 py-0.5">
                      {srv.serviceType}
                    </span>
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full inline-block",
                        srv.status === "running" ? "bg-hud-green animate-pulse" : "bg-hud-magenta"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Táctico con Acciones de Gestión */}
      <div className="pt-3 border-t border-panel-border/30 flex items-center justify-between font-mono text-xs">
        <button
          onClick={handleStatusToggle}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 border transition-colors text-[11px]",
            node.status === "online"
              ? "border-hud-yellow/40 text-hud-yellow hover:bg-hud-yellow/10"
              : "border-hud-green/40 text-hud-green hover:bg-hud-green/10"
          )}
          title="Alternar estado de operación del servidor"
        >
          <Power className="w-3 h-3" />
          <span>{node.status === "online" ? "SUSPENDER NODO" : "ACTIVAR NODO"}</span>
        </button>

        <button
          onClick={handleDelete}
          className="p-1.5 text-slate-500 hover:text-hud-magenta hover:bg-hud-magenta/10 border border-transparent hover:border-hud-magenta/30 transition-colors"
          title="Eliminar nodo de la infraestructura"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </HudCard>
  );
}
