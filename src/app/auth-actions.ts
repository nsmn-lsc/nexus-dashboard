"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: callbackUrl,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Credenciales de autenticación no autorizadas o inválidas." };
        default:
          return { success: false, error: "Fallo de enlace de red táctico. Intente de nuevo." };
      }
    }
    // IMPORTANTE: En Next.js / Auth.js, redirectTo arroja un NEXT_REDIRECT que debe re-lanzarse
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
