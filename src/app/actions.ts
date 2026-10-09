"use server";

import { db } from "@/db";
import { projects, projectServices, tasks, devlogs, webhookEndpoints, webhookDeliveries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/session";
import { dispatchWebhook, generateWebhookSecret } from "@/lib/webhooks";

// Validación de sesión
async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado. Inicie sesión para operar en el centro táctico.");
  }
  return session.user;
}

// -----------------------------------------------------------------------------
// 1. PROJECT ACTIONS
// -----------------------------------------------------------------------------
const projectSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug debe ser válido").regex(/^[a-z0-9-]+$/, "Slug en minúsculas y guiones"),
  description: z.string().optional(),
  type: z.enum(["laboral", "personal", "infra"]),
  repoUrl: z.string().url("URL de repositorio inválida").optional().or(z.literal("")),
  defaultBranch: z.string().default("main"),
  status: z.enum(["active", "maintenance", "paused"]),
});

export async function createProjectAction(formData: FormData) {
  await requireAuth();

  const rawData = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    type: formData.get("type"),
    repoUrl: formData.get("repoUrl"),
    defaultBranch: formData.get("defaultBranch") || "main",
    status: formData.get("status") || "active",
  };

  const parsed = projectSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const [created] = await db
      .insert(projects)
      .values({
        ...parsed.data,
        repoUrl: parsed.data.repoUrl || null,
        description: parsed.data.description || null,
      })
      .returning();

    // Disparar evento de despliegue/creación
    await dispatchWebhook("project.created", {
      projectId: created.id,
      name: created.name,
      slug: created.slug,
      type: created.type,
      status: created.status,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/projects");
    return { success: true, project: created };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, message: "Error al registrar proyecto en base de datos." };
  }
}

// -----------------------------------------------------------------------------
// 2. SERVICE & PORT ACTIONS
// -----------------------------------------------------------------------------
const serviceSchema = z.object({
  projectId: z.string().uuid("ID de proyecto inválido"),
  nodeId: z.string().uuid("ID de nodo inválido"),
  port: z.coerce.number().int().min(1).max(65535, "Puerto debe estar entre 1 y 65535"),
  internalPort: z.coerce.number().int().min(1).max(65535).optional().or(z.literal(0)),
  protocol: z.string().default("tcp"),
  serviceType: z.enum(["caddy", "uvicorn", "container", "systemd"]),
  status: z.enum(["running", "stopped", "failed"]),
});

export async function createServiceAction(formData: FormData) {
  await requireAuth();

  const internalPortVal = formData.get("internalPort");
  const parsed = serviceSchema.safeParse({
    projectId: formData.get("projectId"),
    nodeId: formData.get("nodeId"),
    port: formData.get("port"),
    internalPort: internalPortVal ? Number(internalPortVal) : undefined,
    protocol: formData.get("protocol") || "tcp",
    serviceType: formData.get("serviceType"),
    status: formData.get("status") || "running",
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const [created] = await db
      .insert(projectServices)
      .values({
        projectId: parsed.data.projectId,
        nodeId: parsed.data.nodeId,
        port: parsed.data.port,
        internalPort: parsed.data.internalPort ? parsed.data.internalPort : null,
        protocol: parsed.data.protocol,
        serviceType: parsed.data.serviceType,
        status: parsed.data.status,
      })
      .returning();

    // Notificar cambio/adición de servicio
    await dispatchWebhook("service.status_change", {
      serviceId: created.id,
      projectId: created.projectId,
      nodeId: created.nodeId,
      port: created.port,
      status: created.status,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/ports");
    revalidatePath("/dashboard/services");
    return { success: true, service: created };
  } catch (error) {
    console.error("Error creating service:", error);
    return { success: false, message: "Error al mapear servicio y puerto." };
  }
}

export async function updateServiceStatusAction(
  serviceId: string,
  newStatus: "running" | "stopped" | "failed"
) {
  await requireAuth();

  try {
    const [updated] = await db
      .update(projectServices)
      .set({ status: newStatus })
      .where(eq(projectServices.id, serviceId))
      .returning();

    if (updated) {
      await dispatchWebhook("service.status_change", {
        serviceId: updated.id,
        projectId: updated.projectId,
        nodeId: updated.nodeId,
        port: updated.port,
        status: updated.status,
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/ports");
    return { success: true };
  } catch (error) {
    console.error("Error updating service status:", error);
    return { success: false, message: "Error al actualizar estado del servicio." };
  }
}

// -----------------------------------------------------------------------------
// 3. TASK ACTIONS
// -----------------------------------------------------------------------------
const taskSchema = z.object({
  projectId: z.string().uuid("ID de proyecto inválido"),
  title: z.string().min(2, "Título requerido"),
  description: z.string().optional(),
  priority: z.enum(["p1", "p2", "p3", "p4"]),
  status: z.enum(["backlog", "in_progress", "review", "done"]),
});

export async function createTaskAction(formData: FormData) {
  await requireAuth();

  const parsed = taskSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority") || "p3",
    status: formData.get("status") || "backlog",
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const [created] = await db
      .insert(tasks)
      .values({
        ...parsed.data,
        description: parsed.data.description || null,
      })
      .returning();

    await dispatchWebhook("task.created", {
      taskId: created.id,
      projectId: created.projectId,
      title: created.title,
      priority: created.priority,
    });

    revalidatePath("/dashboard");
    return { success: true, task: created };
  } catch (error) {
    console.error("Error creating task:", error);
    return { success: false, message: "Error al crear tarea." };
  }
}

export async function updateTaskStatusAction(taskId: string, newStatus: "backlog" | "in_progress" | "review" | "done") {
  await requireAuth();

  try {
    await db.update(tasks).set({ status: newStatus }).where(eq(tasks.id, taskId));
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating task status:", error);
    return { success: false, message: "Error al actualizar estado de tarea." };
  }
}

// -----------------------------------------------------------------------------
// 4. DEVLOG ACTIONS
// -----------------------------------------------------------------------------
const devlogSchema = z.object({
  projectId: z.string().uuid("ID de proyecto inválido"),
  title: z.string().min(2, "Título requerido"),
  markdownContent: z.string().min(5, "El contenido debe tener al menos 5 caracteres"),
});

export async function createDevlogAction(formData: FormData) {
  await requireAuth();

  const parsed = devlogSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    markdownContent: formData.get("markdownContent"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const [created] = await db
      .insert(devlogs)
      .values(parsed.data)
      .returning();

    await dispatchWebhook("devlog.entry", {
      devlogId: created.id,
      projectId: created.projectId,
      title: created.title,
    });

    revalidatePath("/dashboard/devlogs");
    revalidatePath("/dashboard");
    return { success: true, devlog: created };
  } catch (error) {
    console.error("Error creating devlog:", error);
    return { success: false, message: "Error al registrar entrada en la bitácora." };
  }
}

// -----------------------------------------------------------------------------
// 5. WEBHOOK MANAGEMENT ACTIONS
// -----------------------------------------------------------------------------
const webhookEndpointSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.enum(["inbound", "outbound"]),
  url: z.string().min(2, "La URL o slug es requerido"),
  secret: z.string().min(8, "El secret debe tener al menos 8 caracteres"),
  events: z.array(z.string()).min(1, "Debe seleccionar al menos un evento"),
  isActive: z.boolean().default(true),
});

export async function createWebhookEndpointAction(formData: FormData) {
  await requireAuth();

  const eventsRaw = formData.getAll("events") as string[];
  const rawData = {
    name: formData.get("name"),
    type: formData.get("type"),
    url: formData.get("url"),
    secret: formData.get("secret") || generateWebhookSecret(),
    events: eventsRaw.length > 0 ? eventsRaw : ["service.status_change"],
    isActive: formData.get("isActive") === "true",
  };

  const parsed = webhookEndpointSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const [created] = await db
      .insert(webhookEndpoints)
      .values(parsed.data)
      .returning();

    revalidatePath("/dashboard/webhooks");
    return { success: true, endpoint: created };
  } catch (error) {
    console.error("Error creating webhook endpoint:", error);
    return { success: false, message: "Error al crear el endpoint del webhook." };
  }
}

export async function toggleWebhookEndpointAction(endpointId: string, currentState: boolean) {
  await requireAuth();

  try {
    await db
      .update(webhookEndpoints)
      .set({ isActive: !currentState })
      .where(eq(webhookEndpoints.id, endpointId));

    revalidatePath("/dashboard/webhooks");
    return { success: true };
  } catch (error) {
    console.error("Error toggling webhook endpoint:", error);
    return { success: false, message: "Error al alternar estado del webhook." };
  }
}

export async function triggerTestWebhookAction(endpointId: string) {
  await requireAuth();

  try {
    const endpoint = await db.query.webhookEndpoints.findFirst({
      where: eq(webhookEndpoints.id, endpointId),
    });

    if (!endpoint) {
      return { success: false, message: "Endpoint no encontrado." };
    }

    const testPayload = {
      event: "test.ping",
      timestamp: new Date().toISOString(),
      origin: "Nexus Tactical Dashboard",
      message: "Prueba de enlace y firma criptográfica HMAC SHA-256.",
    };

    if (endpoint.type === "outbound") {
      const res = await dispatchWebhook("test.ping", testPayload);
      revalidatePath("/dashboard/webhooks");
      return { success: true, result: res };
    } else {
      // Registrar prueba simulada de recepción
      await db.insert(webhookDeliveries).values({
        endpointId: endpoint.id,
        eventType: "test.ping",
        payload: testPayload,
        statusCode: 200,
        responseBody: "Prueba inbound simulada con éxito",
        status: "success",
      });
      revalidatePath("/dashboard/webhooks");
      return { success: true };
    }
  } catch (error) {
    console.error("Error triggering test webhook:", error);
    return { success: false, message: "Fallo en la prueba de webhook." };
  }
}
