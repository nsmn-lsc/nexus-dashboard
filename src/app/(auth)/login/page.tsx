"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  Fingerprint,
  Radio,
  AlertTriangle,
} from "lucide-react";
import { loginAction } from "@/app/auth-actions";
import { NetworkCanvas } from "@/components/auth/NetworkCanvas";
import { BootTerminal } from "@/components/auth/BootTerminal";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Piezas visuales auxiliares
// -----------------------------------------------------------------------------

/** Esquinas tipo retícula HUD. */
function CornerBrackets({ className }: { className?: string }) {
  const base = "absolute w-4 h-4 border-hud-cyan pointer-events-none";
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)} aria-hidden="true">
      <span className={cn(base, "top-0 left-0 border-t-2 border-l-2")} />
      <span className={cn(base, "top-0 right-0 border-t-2 border-r-2")} />
      <span className={cn(base, "bottom-0 left-0 border-b-2 border-l-2")} />
      <span className={cn(base, "bottom-0 right-0 border-b-2 border-r-2")} />
    </div>
  );
}

/** Reloj UTC en vivo (solo cliente para evitar desajustes de hidratación). */
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="tabular-nums">
      {now ? now.toISOString().slice(11, 19) : "--:--:--"} <span className="text-slate-500">UTC</span>
    </span>
  );
}

/** Fondo vivo: imagen ambiental, auroras, constelación, piso en perspectiva, scanlines. */
function LoginBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 nx-kenburns">
        <Image
          src="/nexus-ambient-bg.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.22]"
        />
      </div>

      {/* Auroras de color */}
      <div className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-hud-cyan/[0.12] blur-[120px] nx-aurora" />
      <div className="absolute -bottom-1/3 -right-1/4 w-[55vw] h-[55vw] rounded-full bg-hud-magenta/[0.10] blur-[130px] nx-aurora-slow" />
      <div className="absolute top-1/3 left-1/2 w-[30vw] h-[30vw] rounded-full bg-hud-green/[0.06] blur-[110px] nx-aurora" />

      {/* Piso de rejilla en perspectiva */}
      <div className="absolute left-[-50%] right-[-50%] bottom-[-10%] h-[55%] nx-floor opacity-40" />

      {/* Constelación de red interactiva */}
      <NetworkCanvas className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Barrido de escaneo */}
      <div className="absolute inset-x-0 top-0 h-32 nx-scan bg-gradient-to-b from-transparent via-hud-cyan/[0.07] to-transparent" />

      {/* Scanlines + viñeta */}
      <div className="absolute inset-0 nx-scanlines opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#090d16_100%)]" />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Campo de formulario premium
// -----------------------------------------------------------------------------

interface LoginFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  hasError?: boolean;
}

function LoginField({ label, icon, trailing, hasError, id, className, ...props }: LoginFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[10px] font-mono font-semibold tracking-[0.2em] text-slate-400 uppercase"
      >
        {label}
      </label>
      <div className="group relative">
        <div
          className={cn(
            "relative flex items-center bg-[#060a12]/80 border transition-all duration-300 nx-clip-sm",
            hasError
              ? "border-hud-magenta/60"
              : "border-panel-border/50 group-focus-within:border-hud-cyan group-focus-within:shadow-[0_0_24px_rgba(0,243,255,0.18),inset_0_0_12px_rgba(0,243,255,0.06)]"
          )}
        >
          <span
            className={cn(
              "pl-3.5 pr-2 transition-colors duration-300",
              hasError ? "text-hud-magenta" : "text-slate-500 group-focus-within:text-hud-cyan"
            )}
          >
            {icon}
          </span>
          <input
            id={id}
            className={cn(
              "peer w-full bg-transparent py-3 pr-3 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none",
              className
            )}
            {...props}
          />
          {trailing}
        </div>
        {/* Barra de foco animada */}
        <span className="absolute left-0 bottom-0 h-px w-0 bg-gradient-to-r from-hud-cyan via-hud-green to-transparent transition-all duration-500 group-focus-within:w-full" />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Formulario de autenticación
// -----------------------------------------------------------------------------

type AuthState = "idle" | "loading" | "granted";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [authState, setAuthState] = useState<AuthState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Dispara la sacudida en cada error sin remontar el formulario
  useEffect(() => {
    if (shakeKey === 0) return;
    setIsShaking(true);
    const t = setTimeout(() => setIsShaking(false), 450);
    return () => clearTimeout(t);
  }, [shakeKey]);

  const isLoading = authState === "loading";
  const isGranted = authState === "granted";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthState("loading");
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("callbackUrl", callbackUrl);

    try {
      const res = await loginAction(formData);
      if (res && !res.success) {
        setErrorMessage(res.error || "Credenciales de autenticación no autorizadas.");
        setShakeKey((k) => k + 1);
        setAuthState("idle");
      } else {
        setAuthState("granted");
      }
    } catch (err: unknown) {
      // Si Next.js redirige (NEXT_REDIRECT), dejamos que la navegación ocurra
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        (err as { message: string }).message.includes("NEXT_REDIRECT")
      ) {
        setAuthState("granted");
        return;
      }
      setErrorMessage("Error de conexión durante el enlace.");
      setShakeKey((k) => k + 1);
      setAuthState("idle");
    }
  };

  const handleCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false);
  };

  // Inclinación 3D del panel hero siguiendo el cursor (sin re-renders)
  const handleHeroMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--rx", `${(-py * 6).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 8).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
  };
  const handleHeroLeave = () => {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
      {/* ------------------------------------------------------------------ */}
      {/* Columna izquierda: Hero cinematográfico                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:col-span-7 hidden lg:block nx-fade-up" style={{ animationDelay: "120ms" }}>
        <div
          ref={heroRef}
          onMouseMove={handleHeroMove}
          onMouseLeave={handleHeroLeave}
          className="relative [perspective:1200px]"
        >
          <div
            className="relative transition-transform duration-300 ease-out will-change-transform"
            style={{ transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))" }}
          >
            <div className="relative nx-clip overflow-hidden border border-hud-cyan/30 bg-[#070b13] shadow-[0_30px_80px_-20px_rgba(0,243,255,0.25)]">
              <div className="relative h-[460px] w-full overflow-hidden">
                <Image
                  src="/nexus-login-hero.jpg"
                  alt="Nexus Tactical Command Center"
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover nx-kenburns"
                />
                {/* Reflejo de luz que sigue el cursor */}
                <div
                  className="absolute inset-0 mix-blend-overlay opacity-70 transition-opacity"
                  style={{
                    background:
                      "radial-gradient(500px circle at var(--mx, 50%) var(--my, 40%), rgba(0,243,255,0.35), transparent 45%)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b13] via-[#070b13]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#070b13]/70 via-transparent to-transparent" />
                <div className="absolute inset-0 nx-scanlines opacity-50" />

                {/* Chips superiores */}
                <div className="absolute top-5 left-5 right-5 flex items-center justify-between font-mono text-[10px] tracking-[0.2em]">
                  <span className="flex items-center gap-2 px-2.5 py-1 bg-black/50 backdrop-blur border border-hud-cyan/30 text-hud-cyan">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-hud-cyan opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full w-2 h-2 bg-hud-cyan" />
                    </span>
                    LIVE FEED
                  </span>
                  <span className="px-2.5 py-1 bg-black/50 backdrop-blur border border-white/10 text-slate-300">
                    <LiveClock />
                  </span>
                </div>

                {/* Título y bitácora */}
                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 font-mono text-[10px] text-hud-cyan uppercase tracking-[0.3em]">
                      <Radio className="w-3.5 h-3.5" />
                      Centro de mando // Hetzner Cloud
                    </div>
                    <h2 className="text-4xl font-bold font-rajdhani leading-none text-white">
                      NEXUS{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-hud-cyan via-hud-green to-hud-cyan">
                        INFRASTRUCTURE
                      </span>{" "}
                      CORE
                    </h2>
                    <p className="text-xs font-mono text-slate-300/90 max-w-md">
                      Auditoría en tiempo real de nodos de cómputo, proxy Caddy y orquestación táctica de puertos.
                    </p>
                  </div>

                  <div className="grid grid-cols-5 gap-4 items-end">
                    <div className="col-span-3 p-3 bg-black/55 backdrop-blur-md border border-white/10">
                      <BootTerminal />
                    </div>

                    {/* Señal de enlace EKG */}
                    <div className="col-span-2 p-3 bg-black/55 backdrop-blur-md border border-white/10 space-y-2">
                      <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-slate-400">
                        <span>SEÑAL DE ENLACE</span>
                        <span className="text-hud-green">ESTABLE</span>
                      </div>
                      <svg viewBox="0 0 200 50" className="w-full h-12" aria-hidden="true">
                        <defs>
                          <linearGradient id="ekg" x1="0" x2="1">
                            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0" />
                            <stop offset="50%" stopColor="#00f3ff" />
                            <stop offset="100%" stopColor="#00ff66" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 25 H40 L48 25 L54 8 L62 42 L70 18 L76 25 H110 L118 25 L124 5 L132 45 L140 15 L146 25 H200"
                          fill="none"
                          stroke="url(#ekg)"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                          className="nx-ekg"
                          style={{ filter: "drop-shadow(0 0 4px rgba(0,243,255,0.8))" }}
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <CornerBrackets className="-inset-2 opacity-70" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Columna derecha: Formulario                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:col-span-5 w-full max-w-md mx-auto space-y-5">
        {/* Encabezado del sistema */}
        <div className="flex items-center justify-between px-1 nx-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute -inset-1 rounded-sm bg-hud-cyan/30 blur-md animate-pulse" />
              <div className="relative w-10 h-10 overflow-hidden border border-hud-cyan/50 nx-clip-sm">
                <Image src="/nexus-icon.png" alt="Nexus" fill sizes="40px" className="object-cover" />
              </div>
            </div>
            <div className="leading-tight">
              <div className="font-rajdhani font-bold text-lg tracking-wider text-white">NEXUS</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                SYS_AUTH // v5.0
              </div>
            </div>
          </div>
          <span className="flex items-center gap-2 px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] border border-hud-green/40 bg-hud-green/10 text-hud-green">
            <span className="w-1.5 h-1.5 rounded-full bg-hud-green animate-pulse shadow-[0_0_8px_#00ff66]" />
            SYSTEM ARMED
          </span>
        </div>

        {/* Tarjeta con borde cónico animado */}
        <div
          className={cn("relative", shakeKey > 0 ? (isShaking ? "nx-shake" : "") : "nx-fade-up")}
          style={{ animationDelay: shakeKey > 0 ? undefined : "180ms" }}
        >
          <div className="relative p-px nx-clip overflow-hidden">
            <div
              className={cn(
                "absolute inset-[-60%] nx-spin-slow",
                errorMessage
                  ? "bg-[conic-gradient(from_0deg,transparent_0deg,#ff0055_70deg,transparent_140deg,transparent_200deg,#ff0055_260deg,transparent_320deg)]"
                  : isGranted
                  ? "bg-[conic-gradient(from_0deg,#00ff66,#00f3ff,#00ff66)]"
                  : "bg-[conic-gradient(from_0deg,transparent_0deg,#00f3ff_60deg,transparent_120deg,transparent_180deg,#ff0055_240deg,transparent_300deg)]"
              )}
              aria-hidden="true"
            />
            <div className="relative nx-clip bg-[#0a0f1c]/[0.92] backdrop-blur-xl p-7 sm:p-8 space-y-6">
              {/* Brillo interior superior */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-hud-cyan/60 to-transparent" />
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-40 bg-hud-cyan/10 blur-3xl rounded-full pointer-events-none" />

              {isGranted ? (
                <div className="relative py-10 flex flex-col items-center text-center space-y-4 nx-granted">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-hud-green/30 blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full border-2 border-hud-green flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-hud-green" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-rajdhani font-bold text-2xl tracking-widest text-hud-green">
                      ACCESO CONCEDIDO
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 tracking-wider">
                      Estableciendo sesión segura con el centro de mando...
                    </div>
                  </div>
                  <div className="w-full h-1 bg-white/5 overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-hud-green to-transparent nx-marquee [animation-duration:1.2s]" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative space-y-2">
                    <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-hud-cyan">
                      <Fingerprint className="w-3.5 h-3.5" />
                      AUTENTICACIÓN DE OPERADOR
                    </div>
                    <h1 className="text-[2.6rem] leading-none font-bold font-rajdhani tracking-wide text-white nx-glitch">
                      NEXUS CONTROLLER
                    </h1>
                    <p className="text-xs font-mono text-slate-400">
                      Ingrese credenciales de operador para acceder al centro de mando.
                    </p>
                  </div>

                  {errorMessage && (
                    <div
                      role="alert"
                      className="relative border border-hud-magenta/50 bg-hud-magenta/10 p-3 flex items-start gap-2.5 text-xs font-mono text-hud-magenta nx-clip-sm"
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold tracking-widest text-[10px]">ACCESO DENEGADO</div>
                        <div className="text-hud-magenta/90">{errorMessage}</div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="relative space-y-5">
                    <LoginField
                      name="username"
                      id="username"
                      label="Identificador de Operador"
                      placeholder="usuario o email"
                      required
                      autoFocus
                      autoComplete="username"
                      disabled={isLoading}
                      hasError={Boolean(errorMessage)}
                      icon={<User className="w-4 h-4" />}
                    />

                    <div className="space-y-1.5">
                      <LoginField
                        name="password"
                        id="password"
                        type={showPassword ? "text" : "password"}
                        label="Clave de Enlace Táctico"
                        placeholder="••••••••••••"
                        required
                        autoComplete="current-password"
                        disabled={isLoading}
                        hasError={Boolean(errorMessage)}
                        onKeyUp={handleCapsLock}
                        onKeyDown={handleCapsLock}
                        icon={<KeyRound className="w-4 h-4" />}
                        trailing={
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="px-3 text-slate-500 hover:text-hud-cyan transition-colors focus:outline-none focus-visible:text-hud-cyan"
                            aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                      />
                      {capsLock && (
                        <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-hud-yellow">
                          <AlertTriangle className="w-3 h-3" />
                          BLOQ MAYÚS ACTIVADO
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        "group relative w-full overflow-hidden nx-clip-sm py-3.5 font-mono text-xs font-bold uppercase tracking-[0.3em] transition-all duration-300 select-none",
                        "bg-gradient-to-r from-hud-cyan via-[#00d9ff] to-hud-green text-[#04121a]",
                        "shadow-[0_0_30px_rgba(0,243,255,0.35)] hover:shadow-[0_0_45px_rgba(0,243,255,0.6)] hover:brightness-110",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1c]",
                        "disabled:cursor-wait disabled:opacity-90",
                        !isLoading && "nx-shimmer"
                      )}
                    >
                      {isLoading ? (
                        <span className="relative inline-flex items-center gap-3">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          VERIFICANDO CREDENCIALES
                        </span>
                      ) : (
                        <span className="relative inline-flex items-center gap-2">
                          AUTORIZAR ENLACE
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                        </span>
                      )}
                    </button>
                  </form>

                  {/* Telemetría inferior */}
                  <div className="relative pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] font-mono tracking-wider text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-hud-green" /> TLS 1.3 / JWT
                    </span>
                    <span className="flex items-center gap-1.5 justify-end">
                      <ShieldCheck className="w-3.5 h-3.5 text-hud-cyan" /> BCRYPT · RATE LIMIT
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div
          className="text-center font-mono text-[10px] text-slate-600 tracking-[0.2em] nx-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          ACCESO MONITOREADO &amp; RESTRINGIDO • IP REGISTRADA EN REVERSE PROXY
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Ticker inferior
// -----------------------------------------------------------------------------

const TICKER_ITEMS = [
  "NEXUS PROJECT CONTROLLER",
  "MATRIZ DE PUERTOS",
  "NODOS HETZNER",
  "WEBHOOKS HMAC SHA-256",
  "DEVLOGS OPERATIVOS",
  "TELEMETRÍA HEARTBEAT",
  "BACKLOG TÁCTICO",
];

function StatusTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="absolute bottom-0 inset-x-0 z-10 border-t border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden" aria-hidden="true">
      <div className="flex w-max nx-marquee py-2">
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-3 px-6 font-mono text-[10px] tracking-[0.3em] text-slate-500 whitespace-nowrap">
            <span className="w-1 h-1 bg-hud-cyan rotate-45" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 pb-16 overflow-hidden">
      <LoginBackdrop />
      <Suspense
        fallback={
          <div className="relative z-10 text-hud-cyan font-mono text-xs animate-pulse">
            CARGANDO SUBSISTEMA DE AUTENTICACIÓN...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <StatusTicker />
    </div>
  );
}
