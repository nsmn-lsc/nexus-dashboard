import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { projects, nodes, projectServices, tasks, devlogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { HudCard } from "@/components/hud/HudCard";
import { HudBadge } from "@/components/hud/HudBadge";
import { CopyCommand } from "@/components/hud/CopyCommand";
import { TaskList } from "@/components/hud/TaskList";
import { MarkdownViewer } from "@/components/hud/MarkdownViewer";
import { ProjectCommandsCard } from "@/components/hud/ProjectCommandsCard";
import { CreateServiceModal } from "@/components/hud/CreateServiceModal";
import { CreateDevlogModal } from "@/components/hud/CreateDevlogModal";
import {
  GitBranch,
  Terminal,
  Network,
  ListTodo,
  FileCode2,
  ExternalLink,
  Shield,
  Layers,
} from "lucide-react";

interface ProjectDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { slug } = await params;

  // Carga de proyecto
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });

  if (!project) {
    notFound();
  }

  // Cargar servicios vinculados con información del nodo
  const services = await db
    .select({
      id: projectServices.id,
      port: projectServices.port,
      internalPort: projectServices.internalPort,
      protocol: projectServices.protocol,
      serviceType: projectServices.serviceType,
      status: projectServices.status,
      nodeName: nodes.name,
      nodeHostIp: nodes.hostIp,
      nodeProvider: nodes.provider,
    })
    .from(projectServices)
    .innerJoin(nodes, eq(projectServices.nodeId, nodes.id))
    .where(eq(projectServices.projectId, project.id));

  // Cargar tareas
  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, project.id));

  // Cargar devlogs ordenados por fecha
  const projectDevlogs = await db
    .select()
    .from(devlogs)
    .where(eq(devlogs.projectId, project.id))
    .orderBy(desc(devlogs.createdAt));

  // Cargar lista de nodos para el modal de asignación de puertos
  const allNodes = await db.select().from(nodes);

  return (
    <div className="space-y-6">
      {/* Header Táctico del Proyecto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-panel-border/30 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-rajdhani tracking-wide text-white">
              {project.name}
            </h1>
            <HudBadge
              variant={project.status === "active" ? "green" : "yellow"}
              pulse={project.status === "active"}
            >
              {project.status.toUpperCase()}
            </HudBadge>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            {project.description || "Sin descripción táctica registrada."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-panel-border/40 bg-panel-light text-slate-300 hover:text-hud-cyan text-xs font-mono transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>REPOSITORIO</span>
            </a>
          )}
          <CreateDevlogModal projects={[{ id: project.id, name: project.name }]} defaultProjectId={project.id} />
        </div>
      </div>

      {/* Grid de 2 Columnas: Overview + Quick Commands */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Overview & Stack */}
        <HudCard className="space-y-4">
          <div className="flex items-center gap-2 border-b border-panel-border/30 pb-2">
            <Layers className="w-4 h-4 text-hud-cyan" />
            <h2 className="font-rajdhani font-bold text-base text-white">
              OVERVIEW & STACK
            </h2>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between border-b border-panel-border/20 pb-1.5">
              <span className="text-slate-500">SLUG:</span>
              <span className="text-slate-300">{project.slug}</span>
            </div>
            <div className="flex justify-between border-b border-panel-border/20 pb-1.5">
              <span className="text-slate-500">TIPO DE PROYECTO:</span>
              <span className="text-hud-cyan uppercase">{project.type}</span>
            </div>
            <div className="flex justify-between border-b border-panel-border/20 pb-1.5">
              <span className="text-slate-500">FRAMEWORK / STACK:</span>
              <span className="text-hud-cyan font-bold uppercase">{project.framework || "django"}</span>
            </div>
            <div className="flex justify-between border-b border-panel-border/20 pb-1.5">
              <span className="text-slate-500">RAMA PRINCIPAL:</span>
              <span className="text-slate-300 flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-hud-yellow" />
                {project.defaultBranch || "main"}
              </span>
            </div>
            <div className="flex justify-between border-b border-panel-border/20 pb-1.5">
              <span className="text-slate-500">SERVICIOS ACTIVOS:</span>
              <span className="text-hud-green font-bold">{services.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">REGISTRADO:</span>
              <span className="text-slate-400">
                {new Date(project.createdAt).toISOString().slice(0, 10)}
              </span>
            </div>
          </div>
        </HudCard>

        {/* Columna Derecha (2 cols): Quick Commands con soporte Multi-Stack (Django, FastAPI, Node, Docker, Ops) */}
        <ProjectCommandsCard
          projectId={project.id}
          projectSlug={project.slug}
          initialFramework={project.framework}
        />
      </div>

      {/* Servicios Vinculados y Mapeo de Puertos */}
      <HudCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-panel-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-hud-cyan" />
            <h2 className="font-rajdhani font-bold text-lg text-white">
              SERVICIOS VINCULADOS & PUERTOS
            </h2>
          </div>
          <CreateServiceModal projectId={project.id} nodes={allNodes} />
        </div>

        {services.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-slate-500">
            NO HAY SERVICIOS NI PUERTOS MAPEADOS PARA ESTE PROYECTO.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#0b101c] text-slate-400 border-b border-panel-border/20 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-medium">Puerto Ext / Int</th>
                  <th className="px-5 py-3 font-medium">Protocolo</th>
                  <th className="px-5 py-3 font-medium">Nodo Host</th>
                  <th className="px-5 py-3 font-medium">Runtime</th>
                  <th className="px-5 py-3 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border/20">
                {services.map((srv) => (
                  <tr key={srv.id} className="hover:bg-panel-light/60 transition-colors">
                    <td className="px-5 py-3 font-semibold text-hud-cyan">
                      :{srv.port}
                      {srv.internalPort && (
                        <span className="text-slate-500 font-normal ml-1">
                          (➔ :{srv.internalPort})
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-300 uppercase">{srv.protocol}</td>
                    <td className="px-5 py-3 text-slate-300">
                      {srv.nodeName} ({srv.nodeHostIp})
                    </td>
                    <td className="px-5 py-3 text-slate-400 uppercase">{srv.serviceType}</td>
                    <td className="px-5 py-3 text-right">
                      <HudBadge variant={srv.status === "running" ? "green" : "magenta"}>
                        {srv.status.toUpperCase()}
                      </HudBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HudCard>

      {/* Task Checklist & DevLogs del Proyecto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Checklist */}
        <HudCard className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-panel-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-hud-cyan" />
              <h2 className="font-rajdhani font-bold text-lg text-white">
                TASK CHECKLIST // SPRINT ACTUAL
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              TOTAL: {projectTasks.length}
            </span>
          </div>
          <TaskList tasks={projectTasks} />
        </HudCard>

        {/* Bitácora Técnica / DevLogs */}
        <HudCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-panel-border/30 pb-3">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-hud-cyan" />
              <h2 className="font-rajdhani font-bold text-lg text-white">
                DEVLOG // BITÁCORA TÉCNICA
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {projectDevlogs.length} ENTRADAS
            </span>
          </div>

          {projectDevlogs.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-slate-500">
              NO HAY ENTRADAS DE BITÁCORA REGISTRADAS PARA ESTE PROYECTO.
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {projectDevlogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border border-panel-border/30 bg-[#070b13] space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-panel-border/20 pb-1.5">
                    <h3 className="font-rajdhani font-bold text-base text-white">
                      {log.title}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(log.createdAt).toISOString().replace("T", " ").slice(0, 16)}
                    </span>
                  </div>
                  <MarkdownViewer content={log.markdownContent} />
                </div>
              ))}
            </div>
          )}
        </HudCard>
      </div>
    </div>
  );
}
