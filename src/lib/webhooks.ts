import crypto from "crypto";
import { db } from "@/db";
import { webhookEndpoints, webhookDeliveries } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Genera un secret seguro para HMAC SHA-256
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * Firma un cuerpo de datos con HMAC SHA-256
 */
export function signPayload(payloadString: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
}

/**
 * Valida de forma segura contra timing attacks una firma recibida
 */
export function verifySignature(
  payloadString: string,
  signature: string,
  secret: string
): boolean {
  try {
    const computed = crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
    const cleanedSignature = signature.replace(/^(sha256=|sha256:)/i, "").trim();

    if (computed.length !== cleanedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(computed, "utf8"),
      Buffer.from(cleanedSignature, "utf8")
    );
  } catch (err) {
    console.error("Error verifying signature:", err);
    return false;
  }
}

/**
 * Despacha un evento a todos los endpoints 'outbound' activos suscritos.
 * Incluye soporte nativo para Telegram Bot API y registro de entregas.
 */
export async function dispatchWebhook(
  eventType: string,
  payload: Record<string, unknown>
): Promise<{ dispatchedCount: number; results: Array<{ endpointId: string; status: string; code?: number }> }> {
  try {
    const activeOutboundEndpoints = await db.query.webhookEndpoints.findMany({
      where: (endpoints, { and, eq }) =>
        and(eq(endpoints.type, "outbound"), eq(endpoints.isActive, true)),
    });

    // Filtrar los suscritos al evento o wildcard '*'
    const targetEndpoints = activeOutboundEndpoints.filter(
      (ep) => ep.events.includes(eventType) || ep.events.includes("*")
    );

    const payloadString = JSON.stringify(payload);
    const results: Array<{ endpointId: string; status: string; code?: number }> = [];

    for (const endpoint of targetEndpoints) {
      const isTelegram =
        endpoint.url.includes("api.telegram.org") ||
        endpoint.name.toLowerCase().includes("telegram");

      let fetchBody: string;
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "NexusController/5.0",
      };

      if (isTelegram) {
        // Formato adaptado para Telegram Bot API: /sendMessage
        const messageText = `⚡ *[NEXUS EVENT]* \`${eventType}\`\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
        fetchBody = JSON.stringify({
          text: messageText,
          parse_mode: "Markdown",
          ...(payload.chat_id ? { chat_id: payload.chat_id } : {}),
        });
      } else {
        fetchBody = payloadString;
        const signature = signPayload(payloadString, endpoint.secret);
        headers["X-Nexus-Signature"] = `sha256=${signature}`;
        headers["X-Hub-Signature-256"] = `sha256=${signature}`;
        headers["X-Nexus-Event"] = eventType;
      }

      // Despacho con timeout seguro de 5 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let statusCode: number | null = null;
      let responseBody: string | null = null;
      let deliveryStatus: "success" | "failed" = "failed";

      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers,
          body: fetchBody,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        statusCode = res.status;
        const text = await res.text();
        responseBody = text.slice(0, 1000); // Guardar máximo 1KB de respuesta

        if (res.ok) {
          deliveryStatus = "success";
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        responseBody = err instanceof Error ? err.message : "Network/Timeout error";
      }

      // Registrar entrega en auditoría
      await db.insert(webhookDeliveries).values({
        endpointId: endpoint.id,
        eventType,
        payload,
        statusCode,
        responseBody,
        status: deliveryStatus,
      });

      results.push({
        endpointId: endpoint.id,
        status: deliveryStatus,
        code: statusCode ?? undefined,
      });
    }

    return { dispatchedCount: targetEndpoints.length, results };
  } catch (error) {
    console.error("Error dispatching webhooks:", error);
    return { dispatchedCount: 0, results: [] };
  }
}
