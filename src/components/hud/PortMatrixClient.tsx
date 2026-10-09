"use client";

import React, { useState, useMemo } from "react";
import { HudCard } from "@/components/hud/HudCard";
import { HudBadge } from "@/components/hud/HudBadge";
import { Network, AlertTriangle, Filter, Server, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export interface PortMatrixItem {
  id: string;
  port: number;
  internalPort: number | null;
  protocol: string;
  serviceType: string;
  status: "running" | "stopped" | "failed";
  projectId: string;
  projectName: string;
  projectSlug: string;
  nodeId: string;
  nodeName: string;
  nodeHostIp: string;
  nodeProvider: "hetzner" | "local";
}

interface PortMatrixClientProps {
  services: PortMatrixItem[];
  nodes: Array<{ id: string; name: string }>;
}

export function PortMatrixClient({ services, nodes }: PortMatrixClientProps) {
  const [selectedNode, setSelectedNode] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Detección de colisiones de puertos: mismo puerto en el mismo nodo asignado a múltiples servicios
  const collisionMap = useMemo(() => {
    const map = new Map<string, number>();
    services.forEach((s) => {
      const key = `${s.nodeId}:${s.port}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (selectedNode !== "all" && s.nodeId !== selectedNode) return false;
      if (selectedStatus !== "all" && s.status !== selectedStatus) return false;
      return true;
    });
  }, [services, selectedNode, selectedStatus]);

  const totalCollisions = useMemo(() => {
    let count = 0;
    collisionMap.forEach((v) => {
      if (v > 1) count += v;
    });
    return count;
  }, [collisionMap]);

  return (
    <div className="space-y-6">
      {/* Resumen de telemetría y Detección de Colisiones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <HudCard>
          <div className="text-slate-400 font-mono text-xs mb-1">PUERTOS TOTALES</div>
          <div className="text-3xl font-bold font-rajdhani text-white">
            {services.length.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">MAPEOS REGISTRADOS</div>
        </HudCard>

        <HudCard variant={totalCollisions > 0 ? "danger" : "default"}>
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>COLISIONES DETECTADAS</span>
            {totalCollisions > 0 ? (
              <AlertTriangle className="w-4 h-4 text-hud-magenta animate-pulse" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-hud-green" />
            )}
          </div>
          <div
            className={`text-3xl font-bold font-rajdhani ${
              totalCollisions > 0 ? "text-hud-magenta" : "text-hud-green"
            }`}
          >
            {totalCollisions.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            {totalCollisions > 0 ? "CONFLICTO DE PUERTOS ACTIVO" : "SIN CONFLICTOS DE ENLACE"}
          </div>
        </HudCard>

        <HudCard>
          <div className="text-slate-400 font-mono text-xs mb-1">NODOS EN MATRIZ</div>
          <div className="text-3xl font-bold font-rajdhani text-white">
            {nodes.length.toString().padStart(2, "0")}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">HETZNER APP / DB / LOCAL</div>
        </HudCard>
      </div>

      {/* Barra de Filtros Tácticos */}
      <HudCard className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Filter className="w-4 h-4 text-hud-cyan" />
            <span className="uppercase font-semibold">FILTROS DE AUDITORÍA:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">NODO:</span>
              <select
                value={selectedNode}
                onChange={(e) => setSelectedNode(e.target.value)}
                className="bg-[#070b12] text-slate-200 border border-panel-border/40 px-3 py-1.5 focus:outline-none focus:border-hud-cyan"
              >
                <option value="all">TODOS LOS NODOS</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">ESTADO:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#070b12] text-slate-200 border border-panel-border/40 px-3 py-1.5 focus:outline-none focus:border-hud-cyan"
              >
                <option value="all">TODOS</option>
                <option value="running">RUNNING</option>
                <option value="stopped">STOPPED</option>
                <option value="failed">FAILED</option>
              </select>
            </div>
          </div>
        </div>
      </HudCard>

      {/* Tabla Matriz de Puertos */}
      <HudCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-panel-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-hud-cyan" />
            <h2 className="font-rajdhani font-bold text-lg text-white">
              MATRIZ DE ASIGNACIÓN DE PUERTOS
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            MOSTRANDO: {filteredServices.length} DE {services.length}
          </span>
        </div>

        {filteredServices.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-slate-500">
            NO HAY SERVICIOS QUE COINCIDAN CON LOS FILTROS SELECCIONADOS.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#0b101c] text-slate-400 border-b border-panel-border/20 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-medium">Puerto Ext / Int</th>
                  <th className="px-5 py-3 font-medium">Protocolo</th>
                  <th className="px-5 py-3 font-medium">Proyecto Vinculado</th>
                  <th className="px-5 py-3 font-medium">Nodo Host</th>
                  <th className="px-5 py-3 font-medium">Runtime</th>
                  <th className="px-5 py-3 font-medium text-right">Estado / Colisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border/20">
                {filteredServices.map((srv) => {
                  const isCollision = (collisionMap.get(`${srv.nodeId}:${srv.port}`) || 0) > 1;

                  return (
                    <tr
                      key={srv.id}
                      className={`hover:bg-panel-light/60 transition-colors ${
                        isCollision ? "bg-hud-magenta/5 border-l-2 border-l-hud-magenta" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isCollision ? "text-hud-magenta" : "text-hud-cyan"}`}>
                            :{srv.port}
                          </span>
                          {srv.internalPort && (
                            <span className="text-slate-500">
                              (➔ :{srv.internalPort})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 uppercase">{srv.protocol}</td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/projects/${srv.projectSlug}`}
                          className="text-slate-200 hover:text-hud-cyan hover:underline font-semibold"
                        >
                          {srv.projectName}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-200">{srv.nodeName}</div>
                        <div className="text-[11px] text-slate-500">{srv.nodeHostIp}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 uppercase">{srv.serviceType}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          {isCollision && (
                            <span className="px-2 py-0.5 text-[10px] font-bold border border-hud-magenta text-hud-magenta bg-hud-magenta/15 animate-pulse">
                              COLISIÓN DETECTADA
                            </span>
                          )}
                          <HudBadge
                            variant={
                              srv.status === "running"
                                ? "green"
                                : srv.status === "failed"
                                ? "magenta"
                                : "yellow"
                            }
                            pulse={srv.status === "running"}
                          >
                            {srv.status.toUpperCase()}
                          </HudBadge>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </HudCard>
    </div>
  );
}
