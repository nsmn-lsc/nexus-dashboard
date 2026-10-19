"use client";

import React, { useEffect, useState, useTransition } from "react";
import { HudBadge } from "@/components/hud/HudBadge";
import { HudButton } from "@/components/hud/HudButton";
import { Clock, LogOut, Server, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/app/auth-actions";

interface HeaderProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const [utcTime, setUtcTime] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <header className="h-14 border-b border-panel-border/40 bg-[#070b13]/85 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30 before:absolute before:inset-x-0 before:bottom-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-hud-cyan/50 before:to-transparent before:pointer-events-none">
      {/* Estado del Nodo Primario */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex w-2.5 h-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-hud-cyan opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-hud-cyan shadow-[0_0_8px_#00f3ff]" />
          </span>
          <span className="font-rajdhani font-bold tracking-widest text-base text-white">
            NEXUS <span className="text-hud-cyan">HUB</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-2">
          <HudBadge variant="green" pulse>
            ONLINE // HETZNER-APP-01
          </HudBadge>
        </div>
      </div>

      {/* Reloj UTC, Telemetría y Operador */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#060911]/80 border border-panel-border/30 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-hud-cyan" />
          <span className="tabular-nums font-semibold tracking-wider">{utcTime || "00:00:00 UTC"}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />

        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#060911]/80 border border-panel-border/30">
          <ShieldCheck className="w-3.5 h-3.5 text-hud-green" />
          <span className="text-slate-200 font-semibold tracking-wider">
            {user?.name || "ADMIN"}
          </span>
          <span className="text-[10px] text-hud-cyan font-bold tracking-widest uppercase px-1.5 py-0.5 border border-hud-cyan/40 bg-hud-cyan/15">
            {user?.role || "ADMIN"}
          </span>
        </div>

        <HudButton
          variant="ghost"
          className="p-2 hover:text-hud-magenta hover:bg-hud-magenta/10 hover:border-hud-magenta/30 border border-transparent transition-all"
          onClick={handleLogout}
          disabled={isPending}
          title="Cerrar enlace táctico"
        >
          <LogOut className="w-4 h-4" />
        </HudButton>
      </div>
    </header>
  );
}
