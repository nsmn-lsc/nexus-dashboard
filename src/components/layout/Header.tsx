"use client";

import React, { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { HudBadge } from "@/components/hud/HudBadge";
import { HudButton } from "@/components/hud/HudButton";
import { Activity, Clock, LogOut, Server, ShieldCheck } from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const [utcTime, setUtcTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b border-panel-border/30 bg-panel/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
      {/* Estado del Nodo Primario */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-hud-cyan" />
          <span className="font-rajdhani font-bold tracking-wider text-sm text-white">
            NEXUS HUB
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
        <div className="hidden md:flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-hud-cyan" />
          <span>{utcTime || "00:00:00 UTC"}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-hud-cyan" />
          <span className="text-slate-300">
            {session?.user?.name || "OPERATOR"}
          </span>
          <span className="text-[10px] text-hud-cyan uppercase px-1.5 py-0.5 border border-hud-cyan/30 bg-hud-cyan/10">
            {/* @ts-expect-error Custom session role */}
            {session?.user?.role || "ADMIN"}
          </span>
        </div>

        <HudButton
          variant="ghost"
          className="p-1.5 hover:text-hud-magenta"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Cerrar enlace"
        >
          <LogOut className="w-4 h-4" />
        </HudButton>
      </div>
    </header>
  );
}
