import React from "react";
import { cn } from "@/lib/utils";

interface HudBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "cyan" | "green" | "magenta" | "yellow" | "muted";
  pulse?: boolean;
}

export function HudBadge({
  children,
  className,
  variant = "cyan",
  pulse = false,
  ...props
}: HudBadgeProps) {
  const variantStyles = {
    cyan: "bg-hud-cyan/10 text-hud-cyan border-hud-cyan/40",
    green: "bg-hud-green/10 text-hud-green border-hud-green/40",
    magenta: "bg-hud-magenta/10 text-hud-magenta border-hud-magenta/40",
    yellow: "bg-hud-yellow/10 text-hud-yellow border-hud-yellow/40",
    muted: "bg-slate-800/40 text-hud-muted border-slate-700/50",
  }[variant];

  const dotStyles = {
    cyan: "bg-hud-cyan",
    green: "bg-hud-green",
    magenta: "bg-hud-magenta",
    yellow: "bg-hud-yellow",
    muted: "bg-slate-500",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-medium tracking-wider uppercase border",
        variantStyles,
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full inline-block",
          dotStyles,
          pulse && "animate-pulse"
        )}
      />
      {children}
    </span>
  );
}
