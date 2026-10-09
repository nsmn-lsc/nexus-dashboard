"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyCommandProps {
  command: string;
  label?: string;
  className?: string;
}

export function CopyCommand({ command, label, className }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between bg-[#070b13] border border-panel-border/30 px-3.5 py-2 font-mono text-xs transition-colors hover:border-hud-cyan/50",
        className
      )}
    >
      <div className="flex flex-col gap-0.5 overflow-hidden pr-3">
        {label && (
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            {label}
          </span>
        )}
        <span className="text-hud-cyan truncate select-all">{command}</span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1.5 text-slate-400 hover:text-hud-cyan hover:bg-hud-cyan/10 transition-colors shrink-0"
        title="Copiar al portapapeles"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-hud-green" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
