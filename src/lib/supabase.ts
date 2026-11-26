import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Cliente con la service role key: solo se usa en el servidor. */
export function db() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
