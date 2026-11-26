"use server";

import { redirect } from "next/navigation";
import { authConfigurado, clienteAuth, correosAdmin } from "@/lib/auth";

export type EstadoLogin = { error: string } | null;

/** Solo rutas internas del admin (evita redirigir a otro sitio) */
function destinoSeguro(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/admin") && !s.startsWith("//") ? s : "/admin";
}

export async function iniciarSesion(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  if (!authConfigurado()) {
    return { error: "Falta configurar SUPABASE_PUBLISHABLE_KEY y ADMIN_EMAILS en .env.local." };
  }
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };

  const supabase = await clienteAuth();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const muchos = /rate|too many/i.test(error.message);
    return { error: muchos ? "Demasiados intentos. Espera unos minutos." : "Correo o contraseña incorrectos." };
  }
  if (!correosAdmin().includes(email)) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene acceso al panel." };
  }
  redirect(destinoSeguro(form.get("next")));
}

export async function cerrarSesion() {
  try {
    const supabase = await clienteAuth();
    await supabase.auth.signOut();
  } catch {
    /* sin configuración: igual vamos al login */
  }
  redirect("/login");
}
