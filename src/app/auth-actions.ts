"use server";

import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/session";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const username = (formData.get("username") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  if (!username || !password) {
    return { success: false, error: "Identificador y clave táctica son requeridos." };
  }

  try {
    // 1. Buscar usuario en base de datos
    const user = await db.query.users.findFirst({
      where: or(eq(users.username, username), eq(users.email, username)),
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "Credenciales de operador inválidas o no autorizadas." };
    }

    // 2. Validar contraseña con Bcrypt (>= 12 rounds)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Credenciales de operador inválidas o no autorizadas." };
    }

    // 3. Crear y firmar JWT de sesión segura
    const sessionToken = await createSessionToken({
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.role,
    });

    // 4. Establecer cookie httpOnly + secure
    await setSessionCookie(sessionToken);
  } catch (error) {
    console.error("Login authentication error:", error);
    return { success: false, error: "Fallo interno en el subsistema de autenticación." };
  }

  // Redirigir de forma limpia fuera del bloque try/catch
  redirect(callbackUrl);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
