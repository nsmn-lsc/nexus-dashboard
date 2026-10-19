"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  Server,
  Network,
  ListTodo,
  FileCode2,
  ChevronLeft,
  ChevronRight,
  TerminalSquare,
  LayoutDashboard,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "ESTADO GLOBAL", href: "/dashboard", icon: LayoutDashboard },
  { label: "PROYECTOS", href: "/dashboard/projects", icon: FolderKanban },
  { label: "MATRIZ DE PUERTOS", href: "/dashboard/ports", icon: Network },
  { label: "NODOS HETZNER", href: "/dashboard/nodes", icon: Server },
  { label: "SUBSISTEMA WEBHOOKS", href: "/dashboard/webhooks", icon: TerminalSquare },
  { label: "TAREAS & SPRINTS", href: "/dashboard/tasks", icon: ListTodo },
  { label: "DEVLOGS", href: "/dashboard/devlogs", icon: FileCode2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "border-r border-panel-border/30 bg-panel/95 backdrop-blur-md transition-all duration-200 flex flex-col justify-between shrink-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-3 space-y-4">
        {/* Marca táctica colapsable */}
        <div className="flex items-center justify-between px-2 py-1">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <TerminalSquare className="w-5 h-5 text-hud-cyan" />
              <span className="font-rajdhani font-bold text-lg text-white tracking-wider">
                NEXUS OPS
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-panel-light text-slate-400 hover:text-hud-cyan transition-colors ml-auto"
            title={isCollapsed ? "Expandir" : "Colapsar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Links de navegación */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 font-mono text-xs transition-all duration-200 border-l-2 select-none",
                  isActive
                    ? "border-hud-cyan bg-gradient-to-r from-hud-cyan/15 via-hud-cyan/5 to-transparent text-hud-cyan font-semibold shadow-[inset_4px_0_12px_rgba(0,243,255,0.12)]"
                    : "border-transparent text-slate-400 hover:bg-panel-light hover:text-slate-100 hover:border-panel-border/60"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-hud-cyan" : "text-slate-400 group-hover:text-hud-cyan"
                  )}
                />
                {!isCollapsed && (
                  <span className="tracking-wider flex-1 truncate">{item.label}</span>
                )}
                {!isCollapsed && isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-hud-cyan animate-pulse shadow-[0_0_6px_#00f3ff]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Telemetría inferior del Sidebar */}
      {!isCollapsed && (
        <div className="p-4 border-t border-panel-border/30 bg-[#060911]/60 text-[10px] font-mono text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-hud-green animate-pulse" />
            <span className="text-slate-300">CORE:</span>
            <span className="text-hud-green">SYSTEMD / CADDY</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-hud-cyan" />
            <span>AUTH: JWT / SECURE</span>
          </div>
        </div>
      )}
    </aside>
  );
}
