import React from "react";
import { db } from "@/db";
import { devlogs, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { HudCard } from "@/components/hud/HudCard";
import { MarkdownViewer } from "@/components/hud/MarkdownViewer";
import { CreateDevlogModal } from "@/components/hud/CreateDevlogModal";
import { FileCode2, Clock, Folder } from "lucide-react";
import Link from "next/link";

export default async function DevlogsPage() {
  // Cargar devlogs con información de proyectos ordenados por fecha descendente
  const logsWithProject = await db
    .select({
      id: devlogs.id,
      title: devlogs.title,
      markdownContent: devlogs.markdownContent,
      createdAt: devlogs.createdAt,
      projectId: projects.id,
      projectName: projects.name,
      projectSlug: projects.slug,
    })
    .from(devlogs)
    .innerJoin(projects, eq(devlogs.projectId, projects.id))
    .orderBy(desc(devlogs.createdAt));

  const allProjects = await db.select({ id: projects.id, name: projects.name }).from(projects);

  return (
    <div className="space-y-6">
      {/* Header del Módulo DevLogs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-panel-border/30 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-rajdhani tracking-wide text-white flex items-center gap-2">
            BITÁCORA TÉCNICA // DEVLOGS & AUDITORÍA
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Registro cronológico de notas de ingeniería, despliegues, incidencias y resoluciones de arquitectura.
          </p>
        </div>
        <CreateDevlogModal projects={allProjects} />
      </div>

      {logsWithProject.length === 0 ? (
        <HudCard className="p-12 text-center">
          <FileCode2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="font-mono text-xs text-slate-400">
            NO HAY ENTRADAS DE DEVLOG REGISTRADAS. CREE UNA NUEVA PARA INICIAR LA BITÁCORA.
          </p>
        </HudCard>
      ) : (
        <div className="space-y-6">
          {logsWithProject.map((log) => (
            <HudCard key={log.id} className="space-y-4">
              {/* Encabezado de la Entrada */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-panel-border/30 pb-3 gap-2">
                <div>
                  <h2 className="text-2xl font-bold font-rajdhani text-white">
                    {log.title}
                  </h2>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Folder className="w-3.5 h-3.5 text-hud-cyan" />
                      <Link
                        href={`/dashboard/projects/${log.projectSlug}`}
                        className="hover:text-hud-cyan hover:underline text-slate-300 font-semibold"
                      >
                        {log.projectName}
                      </Link>
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.createdAt).toISOString().replace("T", " ").slice(0, 16)} UTC
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 uppercase px-2 py-1 bg-[#070b13] border border-panel-border/20 self-start sm:self-auto">
                  DEVLOG_ID: {log.id.slice(0, 8)}
                </div>
              </div>

              {/* Renderizado de Markdown Seguro con Syntax Highlighting */}
              <div className="pt-1">
                <MarkdownViewer content={log.markdownContent} />
              </div>
            </HudCard>
          ))}
        </div>
      )}
    </div>
  );
}
