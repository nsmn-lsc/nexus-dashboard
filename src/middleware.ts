import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas protegidas que requieren token de sesión activo
const PROTECTED_PREFIXES = ["/dashboard", "/api/projects", "/api/nodes"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  // Comprobar cookies de sesión de Auth.js
  const sessionTokenProd = request.cookies.get("__Secure-authjs.session-token");
  const sessionTokenDev = request.cookies.get("authjs.session-token");
  const hasValidSession = Boolean(sessionTokenProd || sessionTokenDev);

  if (!hasValidSession) {
    // Si es petición API protegida, retornar 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Acceso no autorizado. Credenciales de sesión requeridas." },
        { status: 401 }
      );
    }

    // Si es acceso web, redirigir a /login guardando la ruta callback
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/projects/:path*",
    "/api/nodes/:path*",
  ],
};
