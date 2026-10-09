"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { HudCard } from "@/components/hud/HudCard";
import { HudInput } from "@/components/hud/HudInput";
import { HudButton } from "@/components/hud/HudButton";
import { HudBadge } from "@/components/hud/HudBadge";
import { ShieldAlert, Terminal, Lock, Cpu } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!res || res.error) {
        setErrorMessage("Credenciales de autenticación no autorizadas o inválidas.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage("Fallo de enlace de red táctico. Intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      {/* Columna Izquierda: Hero Card Táctico con la Imagen Representativa */}
      <div className="lg:col-span-6 hidden lg:block">
        <HudCard className="p-2 overflow-hidden border-hud-cyan/40 relative group">
          <div className="relative h-96 w-full overflow-hidden">
            <Image
              src="/nexus-login-hero.jpg"
              alt="Nexus Tactical Command Center"
              fill
              className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
              priority
            />
            {/* Overlay sutil estilo HUD scanline */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/30 to-transparent" />
            
            <div className="absolute bottom-4 left-4 right-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-hud-cyan animate-pulse" />
                <span className="font-mono text-[11px] text-hud-cyan uppercase tracking-widest font-semibold">
                  CENTRO DE MANDO // HETZNER CLOUD
                </span>
              </div>
              <h2 className="text-xl font-bold font-rajdhani text-white">
                NEXUS INFRASTRUCTURE CORE
              </h2>
              <p className="text-[11px] font-mono text-slate-300">
                Auditoría en tiempo real de nodos de cómputo, proxy Caddy y orquestación táctica de puertos.
              </p>
            </div>
          </div>
        </HudCard>
      </div>

      {/* Columna Derecha: Formulario de Autenticación */}
      <div className="lg:col-span-6 space-y-4">
        {/* Encabezado del Sistema */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 rounded overflow-hidden border border-hud-cyan/40">
              <Image
                src="/nexus-icon.png"
                alt="Nexus Icon"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
              SYS_AUTH // VER 5.0
            </span>
          </div>
          <HudBadge variant="cyan" pulse>
            SYSTEM ARMED
          </HudBadge>
        </div>

        <HudCard className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-rajdhani tracking-wide text-white flex items-center gap-2">
              NEXUS CONTROLLER
            </h1>
            <p className="text-xs font-mono text-slate-400">
              Ingrese credenciales de operador para acceder al centro de mando.
            </p>
          </div>

          {errorMessage && (
            <div className="border border-hud-magenta/40 bg-hud-magenta/10 p-3 flex items-start gap-2 text-xs font-mono text-hud-magenta">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <HudInput
                id="username"
                label="Identificador de Operador (Usuario / Email)"
                placeholder="admin o admin@nexus.internal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-1">
              <HudInput
                id="password"
                type="password"
                label="Clave de Enlace Táctico"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="pt-2">
              <HudButton
                type="submit"
                variant="primary"
                className="w-full py-3"
                isLoading={isLoading}
              >
                AUTORIZAR ENLACE
              </HudButton>
            </div>
          </form>

          {/* Telemetría inferior */}
          <div className="pt-4 border-t border-panel-border/30 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-hud-cyan" /> HETZNER NODE APP-01
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-hud-green" /> TLS 1.3 / JWT SECURE
            </span>
          </div>
        </HudCard>

        {/* Footer técnico */}
        <div className="text-center font-mono text-[10px] text-slate-600 tracking-wider">
          ACCESO MONITOREADO & RESTRINGIDO • IP REGISTRADA EN REVERSE PROXY
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-hud-cyan font-mono text-xs animate-pulse">
            CARGANDO SUBSISTEMA DE AUTENTICACIÓN...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
