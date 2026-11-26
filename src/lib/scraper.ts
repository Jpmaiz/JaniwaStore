import "server-only";
import { adivinarCategoria, detectarTienda, normalizar } from "./tiendas";
import { adivinarGenero, adivinarTipo, type Genero } from "./catalogo";
import type { Moneda, Status } from "./types";

/**
 * Lector de productos "método fácil" (sin IA).
 * Las tiendas dejan los datos del producto escondidos en su HTML para Google:
 *   1) JSON-LD (schema.org/Product)  → lo más completo
 *   2) etiquetas <meta> Open Graph  → respaldo
 */

export type Lectura = {
  url: string;
  store: string;
  shipping_usd: number;
  name: string | null;
  color: string | null;
  /** Precio en la moneda de `currency` */
  price_usd: number | null;
  currency: Moneda | null;
  image_url: string | null;
  status: Status | null;
  category: string | null;
  genero: Genero | null;
  subcategoria: string | null;
};

export type ResultadoLectura =
  | { ok: true; data: Lectura; avisos: string[] }
  | { ok: false; error: string; data: Lectura | null };

type Obj = Record<string, unknown>;

const NAVEGADOR = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const MAX_HTML = 3_000_000;

/** Solo links normales de tiendas: nada de IPs ni direcciones internas. */
function validarUrl(u: string): URL | null {
  try {
    const url = new URL(u.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const h = url.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".")) return null;
    if (/^\d+(\.\d+){3}$/.test(h) || h.includes(":") || h.startsWith("[")) return null;
    return url;
  } catch {
    return null;
  }
}

const NOMBRADAS: Record<string, string> = {
  trade: "™", reg: "®", copy: "©", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…",
};

function decodificar(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&(trade|reg|copy|ndash|mdash|rsquo|lsquo|rdquo|ldquo|hellip);/g, (_, e: string) => NOMBRADAS[e] ?? "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function aNumero(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? v : null;
  if (typeof v !== "string") return null;
  let s = v.replace(/[^\d.,]/g, "");
  if (!s) return null;
  if (s.includes(",") && s.includes(".")) {
    // El último separador es el decimal: "1,299.00" (EE. UU.) o "1.299,00" (Bolivia/Europa)
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/\.\d{3}$/.test(s) && !/\.\d{1,2}$/.test(s)) s = s.replace(/\./g, "");
  else s = s.replace(/,/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function texto(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return decodificar(v);
  if (Array.isArray(v)) return texto(v[0]);
  if (v && typeof v === "object") return texto((v as Obj).name ?? (v as Obj)["@value"]);
  return null;
}

function imagen(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v)) return imagen(v[0]);
  if (v && typeof v === "object") return imagen((v as Obj).url ?? (v as Obj).contentUrl);
  return null;
}

function estado(v: unknown): Status | null {
  const s = String(v ?? "");
  if (/OutOfStock|SoldOut|Discontinued/i.test(s)) return "AGOTADO";
  if (/InStock|LimitedAvailability|OnlineOnly|PreOrder|BackOrder|InStoreOnly/i.test(s)) return "EN STOCK";
  if (/^in stock$/i.test(s)) return "EN STOCK";
  if (/out of stock|sold out/i.test(s)) return "AGOTADO";
  return null;
}

function esTipo(o: Obj, tipo: string): boolean {
  const t = o["@type"];
  const lista = Array.isArray(t) ? t : [t];
  return lista.some((x) => String(x ?? "").toLowerCase() === tipo);
}

/* ── JSON-LD ── */

function bloquesJsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]+type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    const raw = m[1].trim().replace(/^<!\[CDATA\[|\]\]>$/g, "").replace(/^<!--|-->$/g, "").trim();
    try {
      out.push(JSON.parse(raw));
    } catch {
      try {
        out.push(JSON.parse(raw.replace(/[\u0000-\u001f]+/g, " ")));
      } catch {
        /* bloque roto: lo ignoramos */
      }
    }
  }
  return out;
}

function aplanar(x: unknown, out: Obj[] = [], prof = 0): Obj[] {
  if (prof > 6 || !x) return out;
  if (Array.isArray(x)) {
    for (const i of x) aplanar(i, out, prof + 1);
  } else if (typeof x === "object") {
    const o = x as Obj;
    out.push(o);
    if (o["@graph"]) aplanar(o["@graph"], out, prof + 1);
    if (o.mainEntity) aplanar(o.mainEntity, out, prof + 1);
  }
  return out;
}

function leerOfertasLd(offers: unknown): { price: number | null; currency: string | null; status: Status | null } {
  const lista = Array.isArray(offers) ? offers : offers ? [offers] : [];
  let status: Status | null = null;
  for (const raw of lista) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Obj;
    if (o.offers) {
      const anidada = leerOfertasLd(o.offers);
      if (anidada.price != null) return anidada;
    }
    const spec = Array.isArray(o.priceSpecification) ? o.priceSpecification[0] : o.priceSpecification;
    const price =
      aNumero(o.price) ?? aNumero(o.lowPrice) ?? aNumero((spec as Obj | undefined)?.price) ?? null;
    status = status ?? estado(o.availability);
    if (price != null) {
      const currency =
        texto(o.priceCurrency) ?? texto((spec as Obj | undefined)?.priceCurrency) ?? null;
      return { price, currency, status: estado(o.availability) ?? status };
    }
  }
  return { price: null, currency: null, status };
}

/** Lo que se encontró en la página; la moneda viene "cruda" (ej. "USD", "Bs", "GBP") */
type Parcial = Partial<Pick<Lectura, "name" | "color" | "price_usd" | "image_url" | "status">> & {
  currency?: string | null;
};

/** Pistas de categoría que deja la tienda: ruta de categorías (breadcrumb) y tipo de producto */
function pistasDeCategoria(html: string): string[] {
  const pistas: string[] = [];
  const objs = bloquesJsonLd(html).flatMap((b) => aplanar(b));
  for (const o of objs) {
    if (esTipo(o, "product") || esTipo(o, "productgroup")) {
      for (const k of ["category", "productType", "additionalType"]) {
        const v = texto(o[k]);
        if (v && !/^https?:/.test(v)) pistas.push(v);
      }
    }
    if (esTipo(o, "breadcrumblist")) {
      const items = Array.isArray(o.itemListElement) ? (o.itemListElement as Obj[]) : [];
      for (const it of items) {
        const nombre = texto(it.name) ?? texto((it.item as Obj | undefined)?.name);
        if (nombre) pistas.push(nombre);
      }
    }
  }
  const m = metas(html);
  for (const k of ["product:category", "og:product:category", "category", "article:section"]) {
    const v = m.get(k);
    if (v) pistas.push(v);
  }
  return pistas.slice(0, 12);
}

function desdeJsonLd(html: string, urlPagina: string): Parcial {
  const objs = bloquesJsonLd(html).flatMap((b) => aplanar(b));
  let producto = objs.find((o) => esTipo(o, "product"));
  const grupo = objs.find((o) => esTipo(o, "productgroup"));

  // Grupo de variantes (talla/color): elegimos la variante del link, o la primera
  if (!producto && grupo) {
    const variantes = (Array.isArray(grupo.hasVariant) ? grupo.hasVariant : []) as Obj[];
    const delLink = variantes.find((v) => {
      const u = texto(v.url) ?? texto((v.offers as Obj | undefined)?.url);
      return u && urlPagina.includes(u.replace(/^https?:\/\/[^/]+/, ""));
    });
    producto = { ...grupo, ...(delLink ?? variantes[0] ?? {}) };
    if (!producto.name) producto.name = grupo.name;
  }
  if (!producto) return {};

  const ofertas = leerOfertasLd(producto.offers ?? grupo?.offers);
  return {
    name: texto(producto.name),
    color: texto(producto.color) ?? (grupo ? texto(grupo.color) : null),
    image_url: imagen(producto.image) ?? (grupo ? imagen(grupo.image) : null),
    price_usd: ofertas.price,
    currency: ofertas.currency,
    status: ofertas.status,
  };
}

/** "USD", "US$", "$" → USD · "BOB", "Bs", "Bs." → BOB · "EUR", "€" → EUR */
function aMoneda(v: string | null | undefined): Moneda | string | null {
  if (!v) return null;
  const s = v.trim().toUpperCase();
  if (!s) return null;
  if (s === "USD" || s === "US$" || s === "$") return "USD";
  if (s === "BOB" || s === "BS" || s === "BS." || s === "BOV") return "BOB";
  if (s === "EUR" || s === "€") return "EUR";
  return s;
}

/** Si la moneda no viene en los datos, la buscamos en el texto del precio ("Bs 480", "65,00 €") */
function monedaDelTexto(html: string): Moneda | null {
  const m = html.match(/<meta[^>]+(?:product:price:amount|og:price:amount)[^>]+content=["']([^"']+)["']/i)?.[1];
  const t = m ?? "";
  if (/€/.test(t)) return "EUR";
  if (/\bBs\.?\s?\d/i.test(t)) return "BOB";
  return null;
}

/* ── <meta> Open Graph ── */

function metas(html: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const a of m[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? "";
    }
    const clave = (attrs.property ?? attrs.name ?? attrs.itemprop ?? "").toLowerCase();
    const valor = attrs.content;
    if (clave && valor && !mapa.has(clave)) mapa.set(clave, decodificar(valor));
  }
  return mapa;
}

function desdeMetas(html: string): Parcial {
  const m = metas(html);
  const titulo = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return {
    name: m.get("og:title") ?? m.get("twitter:title") ?? (titulo ? decodificar(titulo) : null),
    color: m.get("product:color") ?? m.get("og:color") ?? null,
    image_url: m.get("og:image") ?? m.get("og:image:secure_url") ?? m.get("twitter:image") ?? null,
    price_usd:
      aNumero(m.get("product:price:amount")) ??
      aNumero(m.get("og:price:amount")) ??
      aNumero(m.get("price")) ??
      aNumero(m.get("twitter:data1")),
    currency:
      m.get("product:price:currency") ?? m.get("og:price:currency") ?? m.get("pricecurrency") ?? null,
    status: estado(m.get("product:availability") ?? m.get("og:availability") ?? m.get("availability")),
  };
}

/* ── Limpieza del nombre ── */

function limpiarNombre(nombre: string, tienda: string, color: string | null): string {
  let n = nombre.replace(/^amazon\.com\s*[:|-]\s*/i, "");
  const tiendaN = normalizar(tienda);
  // "Old Skool Shoe | Vans" → "Old Skool Shoe"
  const partes = n.split(/\s+[|–—]\s+/);
  const utiles = partes.filter((p) => {
    const pn = normalizar(p);
    return pn && pn !== tiendaN && !/\.(com|net|co)\b/i.test(p) && !/^(shop|buy|official site)/i.test(p);
  });
  n = (utiles[0] ?? partes[0]).trim();
  // "Old Skool Shoe - Vans" → quitar la tienda al final
  n = n.replace(new RegExp(`\\s*[-:]\\s*${tienda.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "");
  // Si el color viene al final del nombre, lo separamos ("... - Black/White")
  if (color) {
    const c = color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    n = n.replace(new RegExp(`\\s*[-,(/]?\\s*${c}\\)?\\s*$`, "i"), "");
  }
  return n.replace(/[™®©]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
}

/* ── Principal ── */

export async function leerPagina(urlTexto: string): Promise<ResultadoLectura> {
  const url = validarUrl(urlTexto);
  if (!url) return { ok: false, error: "Ese link no es válido. Copia la dirección completa del producto (https://…).", data: null };

  const tienda = detectarTienda(url.href) ?? { store: "OTRA", envio: 10, moneda: "USD" as Moneda };
  const base: Lectura = {
    url: url.href,
    store: tienda.store,
    shipping_usd: tienda.envio,
    name: null,
    color: null,
    price_usd: null,
    currency: tienda.moneda,
    image_url: null,
    status: null,
    category: null,
    genero: null,
    subcategoria: null,
  };

  let html: string;
  let codigo: number;
  try {
    const res = await fetch(url.href, {
      headers: NAVEGADOR,
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    codigo = res.status;
    if (res.url && !validarUrl(res.url)) {
      return { ok: false, error: "La tienda redirigió a una dirección no permitida.", data: base };
    }
    html = (await res.text()).slice(0, MAX_HTML);
  } catch (e) {
    const tiempo = e instanceof Error && e.name === "TimeoutError";
    return {
      ok: false,
      error: tiempo ? `${tienda.store} tardó demasiado en responder. Escribe el precio a mano.` : `No se pudo abrir la página de ${tienda.store}.`,
      data: base,
    };
  }

  const ld = desdeJsonLd(html, url.href);
  const meta = desdeMetas(html);
  const encontrado = ld.name || ld.price_usd != null || meta.price_usd != null;

  const bloqueado =
    codigo === 403 || codigo === 429 || codigo === 503 ||
    (!encontrado && /captcha|robot check|are you a human|access denied|request blocked|pardon our interruption/i.test(html.slice(0, 50_000)));
  if (bloqueado) {
    return {
      ok: false,
      error: `${tienda.store} bloqueó la lectura automática. Escribe el precio a mano.`,
      data: base,
    };
  }
  if (codigo >= 400) {
    return { ok: false, error: `La tienda respondió con error ${codigo}. Revisa que el link funcione.`, data: base };
  }

  const color = ld.color ?? meta.color ?? null;
  const monedaLeida = aMoneda((ld.price_usd != null ? ld.currency : meta.currency) ?? ld.currency ?? meta.currency);
  const monedaRara = typeof monedaLeida === "string" && !["USD", "BOB", "EUR"].includes(monedaLeida) ? monedaLeida : null;
  const moneda: Moneda =
    (monedaLeida && !monedaRara ? (monedaLeida as Moneda) : null) ?? monedaDelTexto(html) ?? tienda.moneda;
  const nombreBruto = ld.name ?? meta.name ?? null;
  const data: Lectura = {
    ...base,
    name: nombreBruto ? limpiarNombre(nombreBruto, tienda.store, color) : null,
    color,
    price_usd: ld.price_usd ?? meta.price_usd ?? null,
    currency: moneda,
    shipping_usd: moneda === "BOB" ? 0 : tienda.envio,
    image_url: ld.image_url ?? meta.image_url ?? null,
    status: ld.status ?? meta.status ?? null,
  };
  if (data.image_url?.startsWith("//")) data.image_url = "https:" + data.image_url;
  if (data.image_url && data.image_url.startsWith("/")) data.image_url = new URL(data.image_url, url).href;
  const pistas = pistasDeCategoria(html);
  const textoNombre = `${data.name ?? ""} ${nombreBruto ?? ""}`;
  data.category = adivinarCategoria(textoNombre, pistas);
  data.genero = adivinarGenero(textoNombre, pistas);
  data.subcategoria = data.category === "ROPA" ? adivinarTipo(textoNombre, pistas) : null;

  const avisos: string[] = [];
  if (!data.name && data.price_usd == null) {
    return { ok: false, error: `No encontré datos del producto en ${tienda.store}. Llénalo a mano.`, data };
  }
  if (data.price_usd == null) avisos.push("No encontré el precio: escríbelo a mano.");
  if (monedaRara) avisos.push(`La tienda cobra en ${monedaRara}: elige la moneda y revisa el precio.`);
  else if (moneda === "EUR") avisos.push("Precio en euros: se convierte a dólares con el cambio del día.");
  else if (moneda === "BOB") avisos.push("Precio en bolivianos: se compara directo en Bs, sin tax ni colchón.");
  if (!data.color) avisos.push("No encontré el color: escríbelo para separar la tarjeta.");
  return { ok: true, data, avisos };
}
