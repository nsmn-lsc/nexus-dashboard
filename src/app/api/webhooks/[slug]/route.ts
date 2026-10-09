import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhookEndpoints, webhookDeliveries, projectServices, devlogs, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySignature } from "@/lib/webhooks";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

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
    (req.headers.get("x-nexus-event") as string) ||
    (payload.event as string) ||
    "inbound.event";

  let actionResult = "Evento procesado";

  // 6. Ejecutar Acciones según el tipo de evento
  try {
    if (eventType === "service.status" || eventType === "healthcheck") {
      const serviceId = (payload.serviceId as string) || (payload.service_id as string);
      const newStatus = payload.status as "running" | "stopped" | "failed";

      if (serviceId && ["running", "stopped", "failed"].includes(newStatus)) {
        await db
          .update(projectServices)
          .set({ status: newStatus })
          .where(eq(projectServices.id, serviceId));
        actionResult = `Servicio ${serviceId} actualizado a ${newStatus}`;
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
      }
    }

    // 7. Registrar Entrega Exitosa en Auditoría
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
