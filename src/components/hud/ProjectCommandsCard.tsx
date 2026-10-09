"use client";

import React, { useState, useTransition } from "react";
import { HudCard } from "@/components/hud/HudCard";
import { CopyCommand } from "@/components/hud/CopyCommand";
import { Terminal, Check, Sparkles } from "lucide-react";
import { updateProjectFrameworkAction } from "@/app/actions";
import { cn } from "@/lib/utils";

interface ProjectCommandsCardProps {
  projectId: string;
  projectSlug: string;
  initialFramework?: string | null;
}

type StackType = "django" | "fastapi" | "node" | "docker" | "ops";

interface CommandItem {
  label: string;
  command: string;
}

export function ProjectCommandsCard({
  projectId,
  projectSlug,
  initialFramework = "django",
}: ProjectCommandsCardProps) {
  const normalizedInitial = (
    ["django", "fastapi", "node", "docker"].includes(initialFramework || "")
      ? initialFramework
      : "django"
  ) as StackType;

  const [activeStack, setActiveStack] = useState<StackType>(normalizedInitial);
  const [currentDefault, setCurrentDefault] = useState<string>(initialFramework || "django");
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSetDefault = (stack: StackType) => {
    startTransition(async () => {
      const res = await updateProjectFrameworkAction(projectId, stack);
      if (res.success) {
        setCurrentDefault(stack);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    });
  };

  const getCommands = (stack: StackType): CommandItem[] => {
    switch (stack) {
      case "django":
        return [
          {
            label: "Arranque Servidor Dev (Django)",
            command: `python manage.py runserver 0.0.0.0:8000`,
          },
          {
            label: "Crear & Aplicar Migraciones",
            command: `python manage.py makemigrations && python manage.py migrate`,
          },
          {
            label: "Recolectar Archivos Estáticos",
            command: `python manage.py collectstatic --noinput`,
          },
          {
            label: "Crear Superusuario de Admin",
            command: `python manage.py createsuperuser`,
          },
          {
            label: "Shell Interactivo (Django)",
            command: `python manage.py shell`,
          },
          {
            label: "Arranque WSGI Producción (Gunicorn)",
            command: `gunicorn ${projectSlug}.wsgi:application --bind 0.0.0.0:8000 -w 4`,
          },
          {
            label: "Reinicio Servicio Systemd",
            command: `sudo systemctl restart ${projectSlug}`,
          },
          {
            label: "Logs en Tiempo Real (Journalctl)",
            command: `journalctl -u ${projectSlug} -f -n 50`,
          },
        ];

      case "fastapi":
        return [
          {
            label: "Arranque Dev con Hot-Reload (Uvicorn)",
            command: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`,
          },
          {
            label: "Aplicar Migraciones Alembic",
            command: `alembic upgrade head`,
          },
          {
            label: "Generar Nueva Migración",
            command: `alembic revision --autogenerate -m "update_models"`,
          },
          {
            label: "Ejecutar Suite de Tests (Pytest)",
            command: `pytest -v`,
          },
          {
            label: "Arranque Producción (Gunicorn + Uvicorn)",
            command: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000`,
          },
          {
            label: "Reinicio Servicio Systemd",
            command: `sudo systemctl restart ${projectSlug}`,
          },
          {
            label: "Logs en Tiempo Real (Journalctl)",
            command: `journalctl -u ${projectSlug} -f -n 50`,
          },
          {
            label: "Inspección de Puertos Escuchando",
            command: `ss -tulpn | grep LISTEN`,
          },
        ];

      case "node":
        return [
          {
            label: "Arranque Desarrollo Local",
            command: `npm run dev`,
          },
          {
            label: "Compilación & Verificación (Build)",
            command: `npm run build`,
          },
          {
            label: "Sincronización de Base de Datos",
            command: `npm run db:push`,
          },
          {
            label: "Instalación Limpia de Dependencias",
            command: `npm ci`,
          },
          {
            label: "Reinicio Servicio Systemd",
            command: `sudo systemctl restart ${projectSlug}`,
          },
          {
            label: "Logs en Tiempo Real (Journalctl)",
            command: `journalctl -u ${projectSlug} -f -n 50`,
          },
        ];

      case "docker":
        return [
          {
            label: "Levantar Contenedores en Background",
            command: `docker compose up -d`,
          },
          {
            label: "Reconstruir Imágenes y Levantar",
            command: `docker compose up -d --build`,
          },
          {
            label: "Logs en Vivo de Contenedores",
            command: `docker compose logs -f --tail=50`,
          },
          {
            label: "Reiniciar Servicio en Docker",
            command: `docker compose restart ${projectSlug}`,
          },
          {
            label: "Shell dentro del Contenedor",
            command: `docker compose exec app sh`,
          },
          {
            label: "Detener Contenedores y Redes",
            command: `docker compose down`,
          },
        ];

      case "ops":
        return [
          {
            label: "Reinicio de Servicio Systemd",
            command: `sudo systemctl restart ${projectSlug}`,
          },
          {
            label: "Estado Operativo (Systemd)",
            command: `sudo systemctl status ${projectSlug}`,
          },
          {
            label: "Logs en Tiempo Real (Journalctl)",
            command: `journalctl -u ${projectSlug} -f -n 50`,
          },
          {
            label: "Recargar Configuración de Daemons",
            command: `sudo systemctl daemon-reload`,
          },
          {
            label: "Puertos y Sockets en Escucha",
            command: `ss -tulpn | grep LISTEN`,
          },
          {
            label: "Test de Conectividad HTTP Local",
            command: `curl -I http://127.0.0.1:8000`,
          },
        ];
    }
  };

  const tabs: Array<{ id: StackType; label: string }> = [
    { id: "django", label: "DJANGO (PYTHON)" },
    { id: "fastapi", label: "FASTAPI" },
    { id: "node", label: "NODE / NEXT" },
    { id: "docker", label: "DOCKER" },
    { id: "ops", label: "SYSTEMD / OPS" },
  ];

  const commands = getCommands(activeStack);

  return (
    <HudCard className="lg:col-span-2 space-y-4">
      {/* Encabezado y Pestañas de Selección de Stack */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-panel-border/30 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-hud-cyan" />
          <h2 className="font-rajdhani font-bold text-base text-white tracking-wide">
            COMANDOS RÁPIDOS // CLI SHORTCUTS
          </h2>
        </div>

        {/* Pestañas de Stacks */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const isActive = activeStack === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStack(tab.id)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-mono tracking-wider transition-colors border",
                  isActive
                    ? "bg-hud-cyan/15 text-hud-cyan border-hud-cyan font-semibold shadow-[0_0_10px_rgba(0,243,255,0.2)]"
                    : "bg-[#070b12] text-slate-400 border-panel-border/40 hover:text-white hover:border-slate-500"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de estado del Stack */}
      <div className="flex items-center justify-between px-1 text-xs font-mono">
        <span className="text-slate-400 flex items-center gap-1.5">
          <span>STACK ACTIVO:</span>
          <span className="text-hud-cyan font-bold uppercase">{activeStack}</span>
          {currentDefault === activeStack && (
            <span className="text-[10px] text-hud-green border border-hud-green/40 bg-hud-green/10 px-1.5 py-0.2">
              PREDETERMINADO
            </span>
          )}
        </span>

        {activeStack !== "ops" && currentDefault !== activeStack && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSetDefault(activeStack)}
            className="text-[11px] text-slate-400 hover:text-hud-cyan transition-colors underline flex items-center gap-1"
          >
            {isPending ? (
              <span>GUARDANDO...</span>
            ) : saveSuccess ? (
              <span className="text-hud-green flex items-center gap-1">
                <Check className="w-3 h-3" /> GUARDADO
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-hud-cyan" /> FIJAR COMO STACK PRINCIPAL
              </span>
            )}
          </button>
        )}
      </div>

      {/* Grid de Comandos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {commands.map((cmd) => (
          <CopyCommand
            key={cmd.label}
            label={cmd.label}
            command={cmd.command}
          />
        ))}
      </div>
    </HudCard>
  );
}
