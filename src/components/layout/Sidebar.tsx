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
} from "lucide-react";

const NAV_ITEMS = [
  { label: "PROYECTOS", href: "/dashboard", icon: FolderKanban },
  { label: "NODOS HETZNER", href: "/dashboard/nodes", icon: Server },
  { label: "PUERTOS & MAPEO", href: "/dashboard/services", icon: Network },
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
                  "flex items-center gap-3 px-3 py-2.5 font-mono text-xs transition-colors border-l-2",
                  isActive
                    ? "border-hud-cyan bg-hud-cyan/10 text-hud-cyan font-semibold"
                    : "border-transparent text-slate-400 hover:bg-panel-light hover:text-slate-200"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-hud-cyan")} />
                {!isCollapsed && <span className="tracking-wider">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Telemetría inferior del Sidebar */}
      {!isCollapsed && (
        <div className="p-4 border-t border-panel-border/20 text-[10px] font-mono text-slate-500 space-y-1">
          <div>RUNTIME: SYSTEMD / CADDY</div>
          <div>AUTH PROTOCOL: JWT / LAX</div>
        </div>
      )}
    </aside>
  );
}
