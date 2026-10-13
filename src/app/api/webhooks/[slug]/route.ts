import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhookEndpoints, webhookDeliveries, projectServices, devlogs, nodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySignature } from "@/lib/webhooks";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function parseListeningPorts(input: unknown): number[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((p) => (typeof p === "number" ? p : parseInt(String(p).trim(), 10)))
      .filter((p) => !isNaN(p));
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((p) => (typeof p === "number" ? p : parseInt(String(p).trim(), 10)))
          .filter((p) => !isNaN(p));
      }
    } catch {
      // Fallback a separación por delimitadores comunes
    }
    return trimmed
      .replace(/[\[\]]/g, "")
      .split(/[,\s]+/)
      .map((p) => parseInt(p.trim(), 10))
      .filter((p) => !isNaN(p));
  }
  return [];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1. Rate Limiting por IP y Endpoint
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

  const rateCheck = checkRateLimit(`webhook:${slug}:${clientIp}`, 30, 60);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Tácticas de defensa activas." },
      { status: 429, headers: { "Retry-After": rateCheck.resetInSeconds.toString() } }
    );
  }

  // 2. Buscar Endpoint Inbound
  const endpoint = await db.query.webhookEndpoints.findFirst({
    where: (ep, { and, eq }) => and(eq(ep.url, slug), eq(ep.type, "inbound")),
  });

  if (!endpoint || !endpoint.isActive) {
    return NextResponse.json(
      { error: "Endpoint inbound no encontrado o inactivo." },
      { status: 404 }
    );
  }

  // 3. Obtener Body y Firmas
  const rawBody = await req.text();
  const signatureHeader =
    req.headers.get("x-nexus-signature") ||
    req.headers.get("x-hub-signature-256") ||
    req.headers.get("x-signature-256");

  if (!signatureHeader) {
    return NextResponse.json(
      { error: "Firma HMAC ausente en cabeceras de enlace." },
      { status: 401 }
    );
  }

  // 4. Validar Firma Criptográfica
  const isValid = verifySignature(rawBody, signatureHeader, endpoint.secret);
  if (!isValid) {
    // Registrar intento fallido en log de auditoría
    await db.insert(webhookDeliveries).values({
      endpointId: endpoint.id,
      eventType: "auth.signature_failed",
      payload: { rawBody: rawBody.slice(0, 500) },
      statusCode: 401,
      responseBody: "Firma HMAC inválida.",
      status: "failed",
    });

    return NextResponse.json(
      { error: "Firma HMAC no válida. Acceso táctico rechazado." },
      { status: 401 }
    );
  }

  // 5. Parsear Payload JSON
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = { text: rawBody };
  }

  const eventType =
    (payload.event as string) ||
    (req.headers.get("x-nexus-event") as string) ||
    "inbound.event";

  // 6. Ejecutar Acciones según el tipo de evento
  try {
    const isTelemetryHeartbeat =
      (payload.event === "service.status" ||
        payload.event === "infra.heartbeat" ||
        eventType === "service.status" ||
        eventType === "infra.heartbeat") &&
      Boolean(payload.node || payload.node_name || payload.nodeName);

    if (isTelemetryHeartbeat) {
      const nodeName = String(
        payload.node || payload.node_name || payload.nodeName
      ).trim();
      const nodeStatusRaw = String(payload.status || "").toLowerCase();
      const rawPorts = payload.listening_ports ?? payload.listeningPorts ?? payload.ports;
      const listeningPorts = parseListeningPorts(rawPorts);
      const listeningSet = new Set(listeningPorts);

      // Buscar nodo en la base de datos
      const targetNode = await db.query.nodes.findFirst({
        where: eq(nodes.name, nodeName),
      });

      if (!targetNode) {
        const errorMsg = `Nodo "${nodeName}" no encontrado en el inventario de infraestructura.`;
        await db.insert(webhookDeliveries).values({
          endpointId: endpoint.id,
          eventType,
          payload,
          statusCode: 404,
          responseBody: errorMsg,
          status: "failed",
        });

        return NextResponse.json({ error: errorMsg }, { status: 404 });
      }

      // Actualizar estado del nodo y timestamp de latido táctico
      const updatedNodeStatus =
        nodeStatusRaw === "running" || nodeStatusRaw === "online"
          ? "online"
          : nodeStatusRaw === "offline" || nodeStatusRaw === "stopped"
          ? "offline"
          : targetNode.status;

      await db
        .update(nodes)
        .set({
          status: updatedNodeStatus,
          last_heartbeat: new Date(),
        })
        .where(eq(nodes.id, targetNode.id));

      // Conciliación de la Matriz de Puertos
      const nodeServices = await db
        .select()
        .from(projectServices)
        .where(eq(projectServices.nodeId, targetNode.id));

      for (const svc of nodeServices) {
        const nextStatus = listeningSet.has(svc.port) ? "running" : "stopped";
        if (svc.status !== nextStatus) {
          await db
            .update(projectServices)
            .set({ status: nextStatus })
            .where(eq(projectServices.id, svc.id));
        }
      }

      // Revalidación de rutas en caché de Next.js
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/nodes");
      revalidatePath("/dashboard/ports");

      const successData = {
        success: true,
        message: "Telemetría y puertos conciliados con éxito",
        node: nodeName,
        updated_ports: nodeServices.length,
      };

      // Registrar auditoría exitosa
      await db.insert(webhookDeliveries).values({
        endpointId: endpoint.id,
        eventType,
        payload,
        statusCode: 200,
        responseBody: JSON.stringify(successData),
        status: "success",
      });

      return NextResponse.json(successData);
    }

    let actionResult = "Evento procesado";

    if (
      (eventType === "service.status" || eventType === "healthcheck") &&
      (payload.serviceId || payload.service_id)
    ) {
      const serviceId = (payload.serviceId as string) || (payload.service_id as string);
      const newStatus = payload.status as "running" | "stopped" | "failed";

      if (serviceId && ["running", "stopped", "failed"].includes(newStatus)) {
        await db
          .update(projectServices)
          .set({ status: newStatus })
          .where(eq(projectServices.id, serviceId));
        actionResult = `Servicio ${serviceId} actualizado a ${newStatus}`;
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/ports");
      }
    } else if (eventType === "devlog.entry") {
      const projectId = (payload.projectId as string) || (payload.project_id as string);
      const title = (payload.title as string) || "Bitácora Automática";
      const markdownContent = (payload.markdownContent as string) || (payload.content as string) || "";

      if (projectId && markdownContent) {
        await db.insert(devlogs).values({
          projectId,
          title,
          markdownContent,
        });
        actionResult = `Bitácora agregada para proyecto ${projectId}`;
        revalidatePath("/dashboard");
      }
    }

    // Registrar Entrega en Auditoría
    await db.insert(webhookDeliveries).values({
      endpointId: endpoint.id,
      eventType,
      payload,
      statusCode: 200,
      responseBody: actionResult,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: actionResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error interno";
    await db.insert(webhookDeliveries).values({
      endpointId: endpoint.id,
      eventType,
      payload,
      statusCode: 500,
      responseBody: errorMsg,
      status: "failed",
    });

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
