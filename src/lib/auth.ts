import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

/**
 * Sesión del admin con Supabase Auth.
 * Usa la clave pública (publishable/anon): solo sirve para iniciar sesión.
 * Los datos se siguen leyendo con la clave secreta, y solo después de comprobar que eres tú.
 */

// Acepta los nombres propios o los que sugiere Supabase (NEXT_PUBLIC_…)
const URL_SUPABASE = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE_PUBLICA =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function authConfigurado(): boolean {
  return !!(URL_SUPABASE && CLAVE_PUBLICA && correosAdmin().length);
}

/** Correos con acceso al panel (ADMIN_EMAILS en .env.local, separados por coma) */
export function correosAdmin(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

export async function clienteAuth() {
  if (!URL_SUPABASE || !CLAVE_PUBLICA) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY en .env.local");
  }
  const galletas = await cookies();
  return createServerClient(URL_SUPABASE, CLAVE_PUBLICA, {
    cookies: {
      getAll: () => galletas.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => galletas.set(name, value, options));
        } catch {
          /* en una página (no en una acción) no se pueden escribir cookies: el proxy las renueva */
        }
      },
    },
  });
}

/** El admin con sesión activa, o null */
export async function usuarioAdmin(): Promise<{ email: string } | null> {
  if (!authConfigurado()) return null;
  try {
    const supabase = await clienteAuth();
    const { data } = await supabase.auth.getUser(); // valida la sesión con Supabase, no solo la cookie
    const email = data.user?.email?.toLowerCase();
    return email && correosAdmin().includes(email) ? { email } : null;
  } catch {
    return null;
  }
}

/** Para páginas y acciones del admin: sin sesión de admin, al login */
export async function requireAdmin(): Promise<{ email: string }> {
  const u = await usuarioAdmin();
  if (!u) redirect("/login");
  return u;
}
