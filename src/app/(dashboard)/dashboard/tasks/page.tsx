import React from "react";
import { db } from "@/db";
import { tasks, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { TasksBoardClient } from "@/components/tasks/TasksBoardClient";
import { TaskItem } from "@/components/tasks/TaskCard";

export default async function TasksPage() {
  // Carga todas las tareas con los datos del proyecto relacionado
  const rawTasks = await db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      projectName: projects.name,
      projectSlug: projects.slug,
      title: tasks.title,
      description: tasks.description,
      priority: tasks.priority,
      status: tasks.status,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .orderBy(desc(tasks.createdAt));

  // Carga los proyectos disponibles para filtros y asignación rápida
  const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .orderBy(projects.name);

  return (
    <div className="space-y-6">
      {/* Encabezado Táctico del Módulo */}
      <div className="border-b border-panel-border/30 pb-4">
        <h1 className="text-3xl font-bold font-rajdhani tracking-wide text-white flex items-center gap-2">
          TAREAS & SPRINTS // TACTICAL BACKLOG & KANBAN
        </h1>
        <p className="text-xs font-mono text-slate-400">
          Orquestación de sprints de desarrollo, resolución de bloqueos críticos y seguimiento de entregables.
        </p>
      </div>

      {/* Tablero Kanban y Gestor de Tareas */}
      <TasksBoardClient
        initialTasks={rawTasks as TaskItem[]}
        projects={allProjects}
      />
    </div>
  );
}
