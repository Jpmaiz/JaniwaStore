import "server-only";
import { db } from "./supabase";
import type { Offer, Product, Settings, Store } from "./types";

const AJUSTES_POR_DEFECTO: Settings = { tax_pct: 7, colchon_pct: 10, paralelo_manual: null, eur_usd_manual: null };

const n = (v: unknown) => (v == null ? null : Number(v));

export type Datos = { products: Product[]; settings: Settings; error: string | null };

/** Tarjetas con sus ofertas + ajustes de cálculo. */
export async function cargarDatos(): Promise<Datos> {
  try {
    const supabase = db();
    const [prods, sets] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, created_at, name, color, category, image_url, destino, notes, " +
            "offers (id, product_id, created_at, url, store, price_usd, shipping_usd, currency, status, image_url, checked_at, check_error)",
        )
        .order("created_at", { ascending: false }),
      supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (prods.error) {
      const m = prods.error.message;
      const sql = /currency/i.test(m) ? "005_monedas.sql" : /offers|color/i.test(m) ? "002_ofertas.sql" : null;
      throw new Error(sql ? `${m} — ¿corriste supabase/${sql}?` : m);
    }

    // Postgres devuelve "numeric" como texto: lo convertimos a número
    const products = ((prods.data ?? []) as unknown as Product[]).map((p) => ({
      ...p,
      offers: (p.offers ?? []).map(
        (o): Offer => ({
          ...o,
          price_usd: n(o.price_usd),
          shipping_usd: Number(o.shipping_usd ?? 0),
          currency: o.currency ?? "USD",
        }),
      ),
    }));
    const s = sets.data as Settings | null;
    const settings: Settings = s
      ? {
          tax_pct: Number(s.tax_pct),
          colchon_pct: Number(s.colchon_pct),
          paralelo_manual: n(s.paralelo_manual),
          eur_usd_manual: n(s.eur_usd_manual),
        }
      : AJUSTES_POR_DEFECTO;
    return { products, settings, error: null };
  } catch (e) {
    return { products: [], settings: AJUSTES_POR_DEFECTO, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Tiendas guardadas + las que aparecen en tus ofertas aunque no tengan ficha. */
export async function cargarTiendas(products: Product[]): Promise<{ stores: Store[]; error: string | null }> {
  const { data, error } = await db()
    .from("stores")
    .select("id, name, url, intereses, notes, favorita")
    .order("name");
  if (error) {
    return { stores: [], error: `${error.message} — ¿corriste supabase/003_tiendas.sql?` };
  }
  const guardadas = (data ?? []) as Store[];
  const nombres = new Set(guardadas.map((s) => s.name));
  const extra: Store[] = [];
  for (const p of products) {
    for (const o of p.offers) {
      if (!nombres.has(o.store)) {
        nombres.add(o.store);
        extra.push({ id: null, name: o.store, url: null, intereses: [], notes: null, favorita: false });
      }
    }
  }
  return { stores: [...guardadas.map((s) => ({ ...s, intereses: s.intereses ?? [] })), ...extra], error: null };
}
