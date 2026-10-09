import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "nexus_super_secret_jwt_key_fallback_minimum_32_characters"
);

const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-nexus.session-token"
    : "nexus.session-token";

export interface TacticalSessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
}

/**
 * Cifra y firma un token JWT de sesión táctica (8 horas)
 */
export async function createSessionToken(user: TacticalSessionUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET_KEY);
}

/**
 * Verifica un token JWT de sesión táctica
 */
export async function verifySessionToken(token: string): Promise<TacticalSessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: (payload.role as "admin" | "operator" | "viewer") || "viewer",
    };
  } catch {
    return null;
  }
}

/**
 * Obtiene la sesión actual desde las cookies seguras de la petición
 */
export async function auth(): Promise<{ user: TacticalSessionUser } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const user = await verifySessionToken(token);
  if (!user) return null;

  return { user };
}

/**
 * Establece la cookie de sesión táctica
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
}

/**
 * Elimina la cookie de sesión
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export { SESSION_COOKIE_NAME };
