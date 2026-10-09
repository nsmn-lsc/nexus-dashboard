import React from "react";
import { db } from "@/db";
import { projects, nodes, projectServices } from "@/db/schema";
import { HudCard } from "@/components/hud/HudCard";
import { HudBadge } from "@/components/hud/HudBadge";
import { HudButton } from "@/components/hud/HudButton";
import { FolderKanban, ArrowRight, ExternalLink, GitBranch, Plus } from "lucide-react";
import Link from "next/link";
import { CreateProjectModal } from "@/components/hud/CreateProjectModal";

export default async function ProjectsIndexPage() {
  const allProjects = await db.select().from(projects);
  const allServices = await db.select().from(projectServices);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-panel-border/30 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-rajdhani tracking-wide text-white flex items-center gap-2">
            REGISTRO DE PROYECTOS // FLEET OVERVIEW
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Administración integral de repositorios, branches y servicios activos.
          </p>
        </div>
        <CreateProjectModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allProjects.map((proj) => {
          const serviceCount = allServices.filter((s) => s.projectId === proj.id).length;

          return (
            <HudCard key={proj.id} className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-hud-cyan uppercase tracking-wider px-2 py-0.5 border border-hud-cyan/30 bg-hud-cyan/10">
                    {proj.type}
                  </span>
                  <HudBadge
                    variant={proj.status === "active" ? "green" : "yellow"}
                    pulse={proj.status === "active"}
                  >
                    {proj.status.toUpperCase()}
                  </HudBadge>
                </div>

                <div>
                  <h2 className="text-xl font-bold font-rajdhani text-white">
                    {proj.name}
                  </h2>
                  <p className="text-xs font-mono text-slate-400 mt-1 line-clamp-2">
                    {proj.description || "Sin descripción táctica registrada."}
                  </p>
                </div>

                <div className="pt-2 border-t border-panel-border/20 space-y-1.5 font-mono text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-hud-yellow" /> RAMA:
                    </span>
                    <span className="text-slate-300">{proj.defaultBranch || "main"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SERVICIOS ACTIVOS:</span>
                    <span className="text-hud-cyan font-bold">{serviceCount}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-panel-border/30 flex items-center justify-between">
                <Link
                  href={`/dashboard/projects/${proj.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-hud-cyan hover:underline"
                >
                  <span>DETALLES TÁCTICOS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {proj.repoUrl && (
                  <a
                    href={proj.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-white"
                    title="Ver repositorio"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </HudCard>
          );
        })}
      </div>
    </div>
  );
}
