/**
 * Catálogo de la tienda: departamentos (Mujer / Hombre), tipos de prenda y categorías.
 * Sirve en el servidor y en el navegador.
 */
import { normalizar } from "./tiendas";

export type Genero = "mujer" | "hombre" | "unisex";

export const GENEROS: { id: Genero; nombre: string }[] = [
  { id: "mujer", nombre: "Mujer" },
  { id: "hombre", nombre: "Hombre" },
  { id: "unisex", nombre: "Unisex" },
];

/** Lo mínimo que hace falta saber de un producto para ubicarlo en el menú */
type Ubicable = { category: string; subcategoria: string | null; genero: Genero | null };

/* ── Tipos de prenda (solo para la categoría ROPA) ── */

type Tipo = { id: string; nombre: string; re: RegExp };

// Orden de DETECCIÓN: lo más específico primero ("denim jacket" → chamarras, "cargo shorts" → shorts)
const DETECCION: Tipo[] = [
  { id: "vestidos", nombre: "Vestidos y faldas", re: /\b(dress(es)?|vestidos?|skirts?|faldas?)\b/ },
  { id: "chamarras", nombre: "Chamarras", re: /\b(jackets?|chamarras?|chaquetas?|coats?|abrigos?|parkas?|windbreakers?|puffers?|vests?|chalecos?)\b/ },
  { id: "hoodies", nombre: "Hoodies y polerones", re: /\b(hoodies?|hooded|sweatshirts?|crewnecks?|polerones?|sudaderas?)\b/ },
  { id: "chompas", nombre: "Chompas", re: /\b(sweaters?|chompas?|cardigans?|knit|pullovers?)\b/ },
  { id: "poleras", nombre: "Poleras", re: /\b(t shirts?|tees?|tanks?|tank tops?|poleras?|camisetas?|graphic)\b/ },
  { id: "camisas", nombre: "Camisas", re: /\b(shirts?|camisas?|flannels?|franelas?|button (up|down)|polos?)\b/ },
  { id: "shorts", nombre: "Shorts", re: /\b(shorts?|bermudas?)\b/ },
  { id: "buzos", nombre: "Buzos", re: /\b(sweatpants|joggers?|buzos?|track ?pants)\b/ },
  { id: "jeans", nombre: "Jeans", re: /\b(jeans?|denim)\b/ },
  { id: "pantalones", nombre: "Pantalones", re: /\b(pants|pantalon(es)?|trousers|chinos?|cargos?|slacks)\b/ },
];

// Orden en el MENÚ (como en una tienda de ropa)
const ORDEN_MENU = ["poleras", "camisas", "hoodies", "chompas", "chamarras", "jeans", "pantalones", "shorts", "buzos", "vestidos"];
export const TIPOS_ROPA: { id: string; nombre: string }[] = ORDEN_MENU.map((id) => {
  const t = DETECCION.find((x) => x.id === id)!;
  return { id: t.id, nombre: t.nombre };
});

export function nombreTipo(id: string | null): string | null {
  return TIPOS_ROPA.find((t) => t.id === id)?.nombre ?? null;
}

/** Tipo de prenda según el nombre y las pistas de la tienda (ruta de categorías) */
export function adivinarTipo(nombre: string, pistas: string[] = []): string | null {
  for (const texto of [...pistas, nombre]) {
    const t = normalizar(texto);
    const hit = DETECCION.find((x) => x.re.test(t));
    if (hit) return hit.id;
  }
  return null;
}

/** Género según el nombre y las pistas ("Men's", "Women's", "Hombre"…); null si no se sabe */
export function adivinarGenero(nombre: string, pistas: string[] = []): Genero | null {
  const t = normalizar([nombre, ...pistas].join(" "));
  if (/\bunisex\b/.test(t)) return "unisex";
  const h = /\b(men|mens|man|male|hombres?|caballeros?|boys?|ninos?)\b/.test(t);
  const m = /\b(women|womens|woman|female|mujer(es)?|damas?|ladies|girls?|ninas?)\b/.test(t);
  if (h && !m) return "hombre";
  if (m && !h) return "mujer";
  return null;
}

/* ── Categorías (para las rutas /c/zapatillas, /c/skate…) ── */

export const CATEGORIAS_SLUG: Record<string, string> = {
  zapatillas: "ZAPATILLAS",
  ropa: "ROPA",
  accesorios: "ACCESORIOS",
  skate: "SKATE",
  tecnologia: "TECNOLOGÍA",
  deportes: "DEPORTES",
  hogar: "HOGAR",
  belleza: "BELLEZA",
  coleccionables: "COLECCIONABLES",
  otros: "OTROS",
};

export function slugCategoria(cat: string): string {
  return Object.entries(CATEGORIAS_SLUG).find(([, v]) => v === cat)?.[0] ?? "otros";
}

/** "TECNOLOGÍA" → "Tecnología" */
export function nombreCategoria(cat: string): string {
  return cat.charAt(0) + cat.slice(1).toLowerCase();
}

/* ── Secciones dentro de Mujer / Hombre ── */

export type Seccion = { slug: string; nombre: string; cumple: (p: Ubicable) => boolean };

export const SECCIONES: Seccion[] = [
  ...TIPOS_ROPA.map((t) => ({
    slug: t.id,
    nombre: t.nombre,
    cumple: (p: Ubicable) => p.category === "ROPA" && p.subcategoria === t.id,
  })),
  { slug: "zapatillas", nombre: "Zapatillas", cumple: (p) => p.category === "ZAPATILLAS" },
  { slug: "accesorios", nombre: "Accesorios", cumple: (p) => p.category === "ACCESORIOS" },
];

/** Lo que va dentro de Mujer / Hombre (una tabla de skate o unos audífonos van en su categoría) */
const DE_DEPARTAMENTO = ["ROPA", "ZAPATILLAS", "ACCESORIOS"];

/** Secciones que se muestran en un departamento (vestidos y faldas solo en Mujer) */
export function seccionesDe(g: "mujer" | "hombre"): Seccion[] {
  return SECCIONES.filter((s) => !(g === "hombre" && s.slug === "vestidos"));
}

/** Un producto unisex (o sin género) aparece en Mujer y en Hombre */
export function delGenero(p: Ubicable, g: "mujer" | "hombre"): boolean {
  if (!DE_DEPARTAMENTO.includes(p.category)) return false;
  const pg = p.genero ?? "unisex";
  return pg === g || pg === "unisex";
}

/** Categorías que van sueltas en el menú (además de Mujer y Hombre) */
export const CATEGORIAS_MENU = ["ZAPATILLAS", "ACCESORIOS", "SKATE", "TECNOLOGÍA", "DEPORTES", "HOGAR", "BELLEZA", "COLECCIONABLES", "OTROS"];

/* ── Qué muestra cada página ── */

export type Vista =
  | { tipo: "nuevo" }
  | { tipo: "todo" }
  | { tipo: "genero"; genero: "mujer" | "hombre"; seccion: string | null }
  | { tipo: "categoria"; categoria: string };

export function filtrar<T extends Ubicable>(productos: T[], v: Vista): T[] {
  switch (v.tipo) {
    case "nuevo":
      return productos.slice(0, 40);
    case "todo":
      return productos;
    case "categoria":
      return productos.filter((p) => p.category === v.categoria);
    case "genero": {
      const sec = SECCIONES.find((s) => s.slug === v.seccion);
      return productos.filter((p) => delGenero(p, v.genero) && (!sec || sec.cumple(p)));
    }
  }
}

/** Secciones de un género que tienen al menos un producto */
export function seccionesConProductos(productos: Ubicable[], g: "mujer" | "hombre"): Seccion[] {
  const delG = productos.filter((p) => delGenero(p, g));
  return SECCIONES.filter((s) => delG.some((p) => s.cumple(p)));
}
