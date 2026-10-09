import React from "react";
import { cn } from "@/lib/utils";

interface HudCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "active" | "danger" | "warning";
  cornerAccent?: boolean;
}

export function HudCard({
  children,
  className,
  variant = "default",
  cornerAccent = true,
  ...props
}: HudCardProps) {
  const borderStyles = {
    default: "border-panel-border/30 hover:border-hud-cyan/50",
    active: "border-hud-cyan/80 shadow-[0_0_15px_rgba(0,243,255,0.15)]",
    danger: "border-hud-magenta/70 shadow-[0_0_15px_rgba(255,0,85,0.15)]",
    warning: "border-hud-yellow/70 shadow-[0_0_15px_rgba(252,238,10,0.15)]",
  }[variant];

  return (
    <div
      className={cn(
        "relative bg-panel text-slate-200 border rounded-none p-5 transition-colors duration-200 backdrop-blur-md",
        borderStyles,
        className
      )}
      {...props}
    >
      {cornerAccent && (
        <>
          {/* Acentos angulares tácticos estilo HUD */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-hud-cyan pointer-events-none" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-hud-cyan pointer-events-none" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-hud-cyan pointer-events-none" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-hud-cyan pointer-events-none" />
        </>
      )}
      {children}
    </div>
  );
}
