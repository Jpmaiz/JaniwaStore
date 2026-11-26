"use server";

import { db } from "@/lib/supabase";

/** Suma 1 al contador "Lo quiero" de un producto publicado (no guarda datos del visitante) */
export async function registrarInteres(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    await db().rpc("incrementar_interes", { pid: id });
  } catch {
    /* el contador es opcional: nunca debe impedir que el cliente escriba por WhatsApp */
  }
}
