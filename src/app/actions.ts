"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { adivinarGenero, adivinarTipo, TIPOS_ROPA } from "@/lib/catalogo";
import { leerPagina, type ResultadoLectura } from "@/lib/scraper";
import { CATEGORIES, MONEDAS, STATUSES, type Moneda, type Status } from "@/lib/types";

export type ActionResult = { ok: true; id?: number } | { ok: false; error: string };

export type OfertaInput = {
  url: string | null;
  store: string;
  price_usd: number | null;
  shipping_usd: number;
  currency: Moneda;
  status: Status;
  image_url: string | null;
};

export type ProductoInput = {
  name: string;
  color: string | null;
  category: string;
  destino: "venta" | "personal";
  notes: string | null;
  image_url: string | null;
  genero?: "mujer" | "hombre" | "unisex" | null;
  subcategoria?: string | null;
  oferta: OfertaInput;
};

const GENEROS_OK = ["mujer", "hombre", "unisex"];
const generoValido = (g: unknown) => (typeof g === "string" && GENEROS_OK.includes(g) ? g : null);
const tipoValido = (t: unknown) => (typeof t === "string" && TIPOS_ROPA.some((x) => x.id === t) ? t : null);

/* ── Limpieza de datos que llegan del navegador ── */

function txt(v: unknown, max = 300): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
}

function link(v: unknown): string | null {
  const s = txt(v, 2000);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 && String(v ?? "").trim() !== "" ? Math.round(n * 100) / 100 : null;
}

function limpiarOferta(o: OfertaInput) {
  return {
    url: link(o.url),
    store: (txt(o.store, 40) ?? "OTRA").toUpperCase(),
    price_usd: num(o.price_usd),
    shipping_usd: num(o.shipping_usd) ?? 0,
    currency: MONEDAS.includes(o.currency) ? o.currency : "USD",
    status: STATUSES.includes(o.status) ? o.status : "EN STOCK",
    image_url: link(o.image_url),
  };
}

function refrescar() {
  revalidatePath("/admin");
  revalidatePath("/admin/tiendas");
  // la tienda pública también muestra fotos y nombres
  revalidatePath("/");
  revalidatePath("/producto/[id]", "page");
}

/* ── Lectura de links ── */

export async function leerLink(url: string): Promise<ResultadoLectura> {
  await requireAdmin();
  return leerPagina(String(url ?? ""));
}

/* ── Tarjetas ── */

export async function crearProducto(input: ProductoInput): Promise<ActionResult> {
  await requireAdmin();
  const name = txt(input.name, 160);
  if (!name) return { ok: false, error: "El nombre del modelo es obligatorio." };
  const category = CATEGORIES.includes(input.category as never) ? input.category : "OTROS";
  const oferta = limpiarOferta(input.oferta);

  const supabase = db();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      color: txt(input.color, 60),
      category,
      destino: input.destino === "personal" ? "personal" : "venta",
      notes: txt(input.notes, 1000),
      image_url: link(input.image_url) ?? oferta.image_url,
      // si el lector no lo detectó, lo deducimos del nombre
      genero: generoValido(input.genero) ?? adivinarGenero(name),
      subcategoria: category === "ROPA" ? tipoValido(input.subcategoria) ?? adivinarTipo(name) : null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "No se pudo crear la tarjeta." };

  const { error: errOferta } = await supabase.from("offers").insert({ ...oferta, product_id: data.id });
  if (errOferta) {
    await supabase.from("products").delete().eq("id", data.id);
    return { ok: false, error: errOferta.message };
  }
  await registrarTienda(oferta.store, oferta.url);
  refrescar();
  return { ok: true, id: data.id };
}

export async function cambiarCategoria(id: number, category: string): Promise<ActionResult> {
  await requireAdmin();
  if (!CATEGORIES.includes(category as never)) return { ok: false, error: "Categoría no válida." };
  const { error } = await db().from("products").update({ category }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}

export async function eliminarProducto(id: number): Promise<ActionResult> {
  await requireAdmin();
  const { error } = await db().from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}

/* ── Ofertas ── */

export async function agregarOferta(productId: number, input: OfertaInput): Promise<ActionResult> {
  await requireAdmin();
  const oferta = limpiarOferta(input);
  const supabase = db();
  const { error } = await supabase
    .from("offers")
    .insert({ ...oferta, product_id: productId, checked_at: oferta.url ? new Date().toISOString() : null });
  if (error) return { ok: false, error: error.message };
  await registrarTienda(oferta.store, oferta.url);

  // Si la tarjeta aún no tiene foto, usamos la de esta oferta
  if (oferta.image_url) {
    await supabase.from("products").update({ image_url: oferta.image_url }).eq("id", productId).is("image_url", null);
  }
  refrescar();
  return { ok: true, id: productId };
}

export async function editarOferta(
  id: number,
  cambios: { price_usd: number | null; shipping_usd: number; currency: Moneda; status: Status },
): Promise<ActionResult> {
  await requireAdmin();
  const { error } = await db()
    .from("offers")
    .update({
      price_usd: num(cambios.price_usd),
      shipping_usd: num(cambios.shipping_usd) ?? 0,
      currency: MONEDAS.includes(cambios.currency) ? cambios.currency : "USD",
      status: STATUSES.includes(cambios.status) ? cambios.status : "EN STOCK",
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}

export async function eliminarOferta(id: number): Promise<ActionResult> {
  await requireAdmin();
  const { error } = await db().from("offers").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}

export type ResultadoRevision =
  | { ok: true; revisadas: number; errores: number; cambios: string[] }
  | { ok: false; error: string };

/** Vuelve a leer todos los links de una tarjeta y actualiza precio y stock. */
export async function revisarPrecios(productId: number): Promise<ResultadoRevision> {
  await requireAdmin();
  const supabase = db();
  const { data: ofertas, error } = await supabase
    .from("offers")
    .select("id, url, store, price_usd, currency, status, image_url")
    .eq("product_id", productId)
    .not("url", "is", null);
  if (error) return { ok: false, error: error.message };
  if (!ofertas?.length) return { ok: false, error: "Ninguna oferta tiene link para revisar." };

  const cambios: string[] = [];
  let errores = 0;
  const ahora = new Date().toISOString();

  for (const o of ofertas) {
    const r = await leerPagina(o.url as string);
    if (!r.ok) {
      errores++;
      await supabase.from("offers").update({ checked_at: ahora, check_error: r.error }).eq("id", o.id);
      continue;
    }
    const upd: Record<string, unknown> = { checked_at: ahora, check_error: null };
    const antes = o.price_usd != null ? Number(o.price_usd) : null;
    const despues = r.data.price_usd;
    // Solo actualizamos si la página sigue cobrando en la misma moneda
    const moneda = (o.currency ?? "USD") as Moneda;
    const mismaMoneda = !r.data.currency || r.data.currency === moneda;
    const sim = moneda === "BOB" ? "Bs " : moneda === "EUR" ? "€" : "$";
    if (despues != null && mismaMoneda && despues !== antes) {
      upd.price_usd = despues;
      cambios.push(`${o.store}: ${antes != null ? sim + antes.toFixed(2) : "sin precio"} → ${sim}${despues.toFixed(2)}`);
    } else if (despues != null && !mismaMoneda) {
      cambios.push(`${o.store}: ahora muestra el precio en ${r.data.currency}; revísalo a mano.`);
    }
    if (r.data.status === "AGOTADO" && o.status !== "AGOTADO") {
      upd.status = "AGOTADO";
      cambios.push(`${o.store}: se agotó`);
    } else if (r.data.status === "EN STOCK" && o.status === "AGOTADO") {
      upd.status = "EN STOCK";
      cambios.push(`${o.store}: volvió a tener stock`);
    }
    if (!o.image_url && r.data.image_url) upd.image_url = r.data.image_url;
    await supabase.from("offers").update(upd).eq("id", o.id);
  }

  refrescar();
  return { ok: true, revisadas: ofertas.length, errores, cambios };
}

/* ── Foto de la tarjeta ── */

export async function cambiarImagenProducto(id: number, url: string | null): Promise<ActionResult> {
  await requireAdmin();
  const { error } = await db().from("products").update({ image_url: link(url) }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}

/* ── Tiendas ── */

/** Crea la ficha de la tienda si no existe (no falla si aún no corriste 003_tiendas.sql). */
async function registrarTienda(nombre: string, url: string | null) {
  try {
    const raiz = url ? new URL(url).origin : null;
    await db().from("stores").upsert({ name: nombre, url: raiz }, { onConflict: "name", ignoreDuplicates: true });
  } catch {
    /* sin tabla stores todavía: no pasa nada */
  }
}

export type CambiosTienda = {
  url?: string | null;
  intereses?: string[];
  notes?: string | null;
  favorita?: boolean;
};

export async function guardarTienda(nombre: string, cambios: CambiosTienda): Promise<ActionResult> {
  await requireAdmin();
  const name = txt(nombre, 40)?.toUpperCase();
  if (!name) return { ok: false, error: "La tienda necesita un nombre." };
  const fila: Record<string, unknown> = { name };
  if ("url" in cambios) fila.url = link(cambios.url);
  if ("notes" in cambios) fila.notes = txt(cambios.notes, 2000);
  if ("favorita" in cambios) fila.favorita = !!cambios.favorita;
  if ("intereses" in cambios) {
    fila.intereses = (cambios.intereses ?? [])
      .map((i) => txt(i, 80))
      .filter((i): i is string => !!i)
      .slice(0, 30);
  }
  const { error } = await db().from("stores").upsert(fila, { onConflict: "name" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/tiendas");
  return { ok: true };
}

export async function eliminarTienda(id: number): Promise<ActionResult> {
  await requireAdmin();
  const { error } = await db().from("stores").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/tiendas");
  return { ok: true };
}

/* ── Venta (tienda pública) ── */

export type DatosVenta = {
  publicado: boolean;
  precio_venta_bs: number | null;
  precio_minimo_bs: number | null;
  tallas: string[];
  disponibilidad: "stock" | "encargo";
  llegada_estimada: string | null;
  descripcion: string | null;
  genero: "mujer" | "hombre" | "unisex" | null;
  subcategoria: string | null;
};

export async function guardarVenta(id: number, d: DatosVenta): Promise<ActionResult> {
  await requireAdmin();
  const precio = num(d.precio_venta_bs);
  const minimo = num(d.precio_minimo_bs);
  if (d.publicado && !precio) return { ok: false, error: "Para publicarlo, ponle un precio de venta." };
  if (precio && minimo && minimo > precio) return { ok: false, error: "El precio mínimo no puede ser mayor al de venta." };
  const fecha = typeof d.llegada_estimada === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.llegada_estimada) ? d.llegada_estimada : null;
  const tallas = Array.from(
    new Set((d.tallas ?? []).map((t) => txt(t, 12)?.toUpperCase()).filter((t): t is string => !!t)),
  ).slice(0, 30);

  // fecha de la primera publicación: ordena "Lo nuevo"
  const { data: actual } = await db().from("products").select("publicado_en").eq("id", id).maybeSingle();
  const publicadoEn = d.publicado && !actual?.publicado_en ? new Date().toISOString() : actual?.publicado_en ?? null;

  const { error } = await db()
    .from("products")
    .update({
      publicado: !!d.publicado,
      publicado_en: publicadoEn,
      genero: generoValido(d.genero),
      subcategoria: tipoValido(d.subcategoria),
      precio_venta_bs: precio,
      precio_minimo_bs: minimo,
      tallas,
      disponibilidad: d.disponibilidad === "stock" ? "stock" : "encargo",
      llegada_estimada: d.disponibilidad === "stock" ? null : fecha,
      descripcion: txt(d.descripcion, 1500),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}

/* ── Ajustes ── */

export async function guardarAjustes(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const manual = txt(form.get("paralelo_manual"));
  const { error } = await db()
    .from("settings")
    .update({
      tax_pct: num(form.get("tax_pct")) ?? 7,
      colchon_pct: num(form.get("colchon_pct")) ?? 10,
      paralelo_manual: manual ? num(manual) : null,
      eur_usd_manual: txt(form.get("eur_usd_manual")) ? num(form.get("eur_usd_manual")) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}
