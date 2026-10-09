import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = ["/dashboard", "/api/projects", "/api/nodes"];

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "nexus_super_secret_jwt_key_fallback_minimum_32_characters"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  // Comprobar cookies de sesión nativas y retrocompatibles
  const sessionToken =
    request.cookies.get("__Secure-nexus.session-token")?.value ||
    request.cookies.get("nexus.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value;

  let isValid = false;

  if (sessionToken) {
    try {
      await jwtVerify(sessionToken, SECRET_KEY);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  if (!isValid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Acceso no autorizado. Credenciales de sesión requeridas." },
        { status: 401 }
      );
    }

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
