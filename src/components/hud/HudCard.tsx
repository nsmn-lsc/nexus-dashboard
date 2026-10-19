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
    default: "border-panel-border/40 hover:border-hud-cyan/60 hover:shadow-[0_0_20px_rgba(0,243,255,0.1)]",
    active: "border-hud-cyan/80 shadow-[0_0_20px_rgba(0,243,255,0.22)] bg-panel-light/90",
    danger: "border-hud-magenta/70 shadow-[0_0_20px_rgba(255,0,85,0.22)] bg-hud-magenta/[0.04]",
    warning: "border-hud-yellow/70 shadow-[0_0_20px_rgba(252,238,10,0.2)] bg-hud-yellow/[0.04]",
  }[variant];

  const bracketColor = {
    default: "border-hud-cyan",
    active: "border-hud-cyan",
    danger: "border-hud-magenta",
    warning: "border-hud-yellow",
  }[variant];

  return (
    <div
      className={cn(
        "relative bg-panel/90 text-slate-200 border p-5 transition-all duration-300 backdrop-blur-md group",
        "before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-hud-cyan/40 before:to-transparent before:pointer-events-none",
        borderStyles,
        className
      )}
      {...props}
    >
      {cornerAccent && (
        <>
          {/* Brackets angulares tácticos estilo HUD con acabado milimétrico */}
          <span className={cn("absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t-2 border-l-2 pointer-events-none transition-colors duration-200", bracketColor)} />
          <span className={cn("absolute -top-[1px] -right-[1px] w-2.5 h-2.5 border-t-2 border-r-2 pointer-events-none transition-colors duration-200", bracketColor)} />
          <span className={cn("absolute -bottom-[1px] -left-[1px] w-2.5 h-2.5 border-b-2 border-l-2 pointer-events-none transition-colors duration-200", bracketColor)} />
          <span className={cn("absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b-2 border-r-2 pointer-events-none transition-colors duration-200", bracketColor)} />
        </>
      )}
      {children}
    </div>
  );
}
