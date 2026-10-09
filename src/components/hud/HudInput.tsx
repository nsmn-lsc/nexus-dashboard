import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface HudInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const HudInput = forwardRef<HTMLInputElement, HudInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-mono font-medium tracking-wider text-slate-400 uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={id}
            ref={ref}
            className={cn(
              "w-full bg-[#070b12] text-slate-200 placeholder-slate-600 border border-panel-border/40 px-3.5 py-2 font-mono text-sm transition-colors duration-150 focus:outline-none focus:border-hud-cyan focus:ring-1 focus:ring-hud-cyan/50",
              error && "border-hud-magenta focus:border-hud-magenta focus:ring-hud-magenta/40",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs font-mono text-hud-magenta flex items-center gap-1 mt-1">
            <span className="inline-block w-1 h-1 bg-hud-magenta rounded-full" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

HudInput.displayName = "HudInput";
