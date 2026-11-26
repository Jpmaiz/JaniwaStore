import "server-only";
import { db } from "./supabase";
import type { ProductoPublico } from "./types";

/**
 * Datos de la tienda pública.
 * Se piden SOLO columnas públicas: nunca costos, ofertas, tiendas de origen ni precio mínimo.
 */
const COLUMNAS =
  "id, name, color, category, image_url, precio_venta_bs, tallas, disponibilidad, llegada_estimada, descripcion, " +
  "offers (image_url)";

type Fila = Omit<ProductoPublico, "precio_venta_bs"> & {
  precio_venta_bs: number | string | null;
  offers: { image_url: string | null }[] | null;
};

function aPublico(f: Fila): ProductoPublico | null {
  const precio = f.precio_venta_bs == null ? null : Number(f.precio_venta_bs);
  if (!precio) return null;
  return {
    id: f.id,
    name: f.name,
    color: f.color,
    category: f.category,
    image_url: f.image_url ?? f.offers?.find((o) => o.image_url)?.image_url ?? null,
    precio_venta_bs: precio,
    tallas: f.tallas ?? [],
    disponibilidad: f.disponibilidad === "stock" ? "stock" : "encargo",
    llegada_estimada: f.llegada_estimada,
    descripcion: f.descripcion,
  };
}

export async function cargarVitrina(): Promise<{ productos: ProductoPublico[]; error: string | null }> {
  try {
    const { data, error } = await db()
      .from("products")
      .select(COLUMNAS)
      .eq("publicado", true)
      .order("disponibilidad", { ascending: false }) // "stock" antes que "encargo"
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return {
      productos: ((data ?? []) as unknown as Fila[]).map(aPublico).filter((p): p is ProductoPublico => !!p),
      error: null,
    };
  } catch (e) {
    return { productos: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export async function cargarProductoPublico(id: number): Promise<ProductoPublico | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  try {
    const { data } = await db().from("products").select(COLUMNAS).eq("id", id).eq("publicado", true).maybeSingle();
    return data ? aPublico(data as unknown as Fila) : null;
  } catch {
    return null;
  }
}

/** Número de WhatsApp del negocio, solo dígitos (ej. 59170000000) */
export function numeroWhatsApp(): string | null {
  const n = (process.env.WHATSAPP_NUMERO ?? "").replace(/\D/g, "");
  return n.length >= 8 ? n : null;
}
