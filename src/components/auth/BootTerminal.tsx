"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type LineKind = "ok" | "info" | "warn";

const BOOT_SEQUENCE: Array<{ kind: LineKind; text: string }> = [
  { kind: "info", text: "Inicializando subsistema SYS_AUTH v5.0" },
  { kind: "ok", text: "Canal cifrado TLS 1.3 negociado" },
  { kind: "ok", text: "Módulo bcrypt (12 rounds) cargado" },
  { kind: "info", text: "Firmador JWT HS256 en espera" },
  { kind: "ok", text: "Rate limiter de enlace armado" },
  { kind: "warn", text: "Acceso restringido // operadores autorizados" },
  { kind: "ok", text: "Receptor de telemetría heartbeat activo" },
  { kind: "info", text: "Esperando credenciales de operador..." },
];

const VISIBLE_LINES = 5;
const TYPE_SPEED_MS = 22;
const LINE_PAUSE_MS = 650;

/**
 * Bitácora de arranque con efecto máquina de escribir en bucle.
 * Puramente decorativa: no refleja estado real de la infraestructura.
 */
export function BootTerminal({ className }: { className?: string }) {
  const [lines, setLines] = useState<Array<{ kind: LineKind; text: string }>>([]);
  const [typing, setTyping] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const target = BOOT_SEQUENCE[index % BOOT_SEQUENCE.length];
    let charPos = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const typeNext = () => {
      charPos++;
      setTyping(target.text.slice(0, charPos));
      if (charPos < target.text.length) {
        timeout = setTimeout(typeNext, TYPE_SPEED_MS);
      } else {
        timeout = setTimeout(() => {
          setLines((prev) => [...prev, target].slice(-VISIBLE_LINES));
          setTyping("");
          setIndex((i) => i + 1);
        }, LINE_PAUSE_MS);
      }
    };

    timeout = setTimeout(typeNext, TYPE_SPEED_MS);
    return () => clearTimeout(timeout);
  }, [index]);

  const current = BOOT_SEQUENCE[index % BOOT_SEQUENCE.length];

  const tag = (kind: LineKind) =>
    kind === "ok" ? (
      <span className="text-hud-green">[ OK ]</span>
    ) : kind === "warn" ? (
      <span className="text-hud-yellow">[WARN]</span>
    ) : (
      <span className="text-hud-cyan">[INFO]</span>
    );

  return (
    <div
      className={cn(
        "font-mono text-[11px] leading-relaxed space-y-0.5 min-h-[7.5rem]",
        className
      )}
      aria-hidden="true"
    >
      {lines.map((l, i) => (
        <div
          key={`${index}-${i}`}
          className="flex gap-2 text-slate-400 truncate"
          style={{ opacity: 0.45 + (i / VISIBLE_LINES) * 0.55 }}
        >
          {tag(l.kind)}
          <span className="truncate">{l.text}</span>
        </div>
      ))}
      <div className="flex gap-2 text-slate-200 truncate">
        {tag(current.kind)}
        <span className="truncate">
          {typing}
          <span className="nx-blink inline-block w-[7px] h-3 -mb-0.5 ml-0.5 bg-hud-cyan" />
        </span>
      </div>
    </div>
  );
}
