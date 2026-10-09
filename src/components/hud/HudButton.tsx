import React from "react";
import { cn } from "@/lib/utils";

interface HudButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
}

export function HudButton({
  children,
  className,
  variant = "primary",
  isLoading = false,
  disabled,
  ...props
}: HudButtonProps) {
  const variantStyles = {
    primary:
      "bg-hud-cyan/15 text-hud-cyan border-hud-cyan hover:bg-hud-cyan hover:text-[#090d16] focus:ring-hud-cyan/50 shadow-[0_0_12px_rgba(0,243,255,0.2)]",
    secondary:
      "bg-panel-light text-slate-200 border-panel-border/40 hover:border-slate-400 hover:text-white focus:ring-slate-500",
    danger:
      "bg-hud-magenta/15 text-hud-magenta border-hud-magenta hover:bg-hud-magenta hover:text-white focus:ring-hud-magenta/50 shadow-[0_0_12px_rgba(255,0,85,0.2)]",
    ghost:
      "bg-transparent text-slate-400 border-transparent hover:text-hud-cyan hover:bg-hud-cyan/10",
  }[variant];

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center font-mono text-xs uppercase tracking-widest px-4 py-2.5 font-semibold transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090d16] disabled:opacity-50 disabled:cursor-not-allowed select-none",
        variantStyles,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>PROCESANDO...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
