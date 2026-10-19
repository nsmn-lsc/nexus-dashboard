"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HudSparklineProps {
  color?: "cyan" | "green" | "yellow" | "magenta";
  className?: string;
  points?: number[];
}

const COLOR_MAP = {
  cyan: {
    stroke: "#00f3ff",
    gradientId: "grad-cyan",
    glow: "rgba(0, 243, 255, 0.45)",
  },
  green: {
    stroke: "#00ff66",
    gradientId: "grad-green",
    glow: "rgba(0, 255, 102, 0.45)",
  },
  yellow: {
    stroke: "#fcee0a",
    gradientId: "grad-yellow",
    glow: "rgba(252, 238, 10, 0.45)",
  },
  magenta: {
    stroke: "#ff0055",
    gradientId: "grad-magenta",
    glow: "rgba(255, 0, 85, 0.45)",
  },
};

/**
 * Gráfico táctico de telemetría de onda/latido en tiempo real (EKG/Sparkline).
 */
export function HudSparkline({
  color = "cyan",
  className,
}: HudSparklineProps) {
  const conf = COLOR_MAP[color];

  return (
    <div className={cn("relative h-9 w-full overflow-hidden pointer-events-none select-none", className)}>
      <svg
        viewBox="0 0 160 36"
        className="w-full h-full preserve-3d"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={conf.gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={conf.stroke} stopOpacity="0.1" />
            <stop offset="60%" stopColor={conf.stroke} stopOpacity="0.9" />
            <stop offset="100%" stopColor={conf.stroke} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`${conf.gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={conf.stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={conf.stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Malla de fondo sutil */}
        <line x1="0" y1="18" x2="160" y2="18" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" strokeWidth="0.75" />
        <line x1="0" y1="9" x2="160" y2="9" stroke="rgba(255,255,255,0.03)" strokeDasharray="2 4" strokeWidth="0.5" />
        <line x1="0" y1="27" x2="160" y2="27" stroke="rgba(255,255,255,0.03)" strokeDasharray="2 4" strokeWidth="0.5" />

        {/* Área rellena semitransparente */}
        <path
          d="M0 24 L25 24 L32 20 L38 28 L45 10 L52 30 L58 18 L70 24 L100 24 L108 8 L114 31 L120 16 L126 24 L160 24 L160 36 L0 36 Z"
          fill={`url(#${conf.gradientId}-fill)`}
        />

        {/* Trazo animado EKG */}
        <path
          d="M0 24 L25 24 L32 20 L38 28 L45 10 L52 30 L58 18 L70 24 L100 24 L108 8 L114 31 L120 16 L126 24 L160 24"
          fill="none"
          stroke={`url(#${conf.gradientId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="nx-ekg"
          style={{ filter: `drop-shadow(0 0 4px ${conf.glow})` }}
        />
      </svg>
    </div>
  );
}
