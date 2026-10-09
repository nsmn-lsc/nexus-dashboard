import { handlers } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const { GET: originalGET, POST: originalPOST } = handlers;

export async function GET(req: NextRequest) {
  return originalGET(req);
}

export async function POST(req: NextRequest) {
  // Extraer IP cliente respetando cabeceras de proxy inverso (Caddy / Nginx en Hetzner)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

  // Rate Limiting para peticiones de autenticación
  const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
    : 5;
  const windowSeconds = process.env.RATE_LIMIT_WINDOW_SECONDS
    ? parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS, 10)
    : 60;

  const rateLimit = checkRateLimit(`auth:${clientIp}`, maxRequests, windowSeconds);

  if (!rateLimit.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Demasiados intentos de acceso táctico. Bloqueo temporal activo.",
        retryAfter: rateLimit.resetInSeconds,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": rateLimit.resetInSeconds.toString(),
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimit.resetInSeconds.toString(),
        },
      }
    );
  }

  const response = await originalPOST(req);

  // Adjuntar cabeceras de rate limit
  response.headers.set("X-RateLimit-Limit", maxRequests.toString());
  response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
  response.headers.set("X-RateLimit-Reset", rateLimit.resetInSeconds.toString());

  return response;
}
