import type { EstadoTarjeta, Moneda, Offer, Product, Settings } from "./types";

export type Costo = {
  moneda: Moneda;
  /** true = compra en Bolivia en Bs: sin tax, colchón ni cambio */
  local: boolean;
  /** Importes del desglose: en USD (compras afuera) o en Bs (compra local) */
  precio: number;
  envio: number;
  tax: number;
  colchon: number;
  /** Precio original en euros, si la tienda cobra en € */
  precioEur: number | null;
  envioEur: number | null;
  totalUsd: number | null;
  totalBs: number | null;
};

/**
 * Costo de una oferta.
 * - USD: precio + envío en USA + tax + colchón → USD → Bs al paralelo
 * - EUR: igual, convirtiendo antes € → USD
 * - BOB: precio + envío local, directo en Bs
 */
export function costoOferta(o: Offer, s: Settings, paralelo: number | null, euroUsd: number | null = null): Costo | null {
  if (o.price_usd == null) return null;
  const precioOrig = Number(o.price_usd);
  const envioOrig = Number(o.shipping_usd);
  const moneda: Moneda = o.currency ?? "USD";

  if (moneda === "BOB") {
    const totalBs = precioOrig + envioOrig;
    return {
      moneda, local: true, precio: precioOrig, envio: envioOrig, tax: 0, colchon: 0,
      precioEur: null, envioEur: null, totalBs, totalUsd: paralelo ? totalBs / paralelo : null,
    };
  }

  let precio = precioOrig;
  let envio = envioOrig;
  if (moneda === "EUR") {
    if (!euroUsd) return null; // sin cambio del euro no se puede calcular
    precio = precioOrig * euroUsd;
    envio = envioOrig * euroUsd;
  }
  const tax = (precio * Number(s.tax_pct)) / 100;
  const subtotal = precio + envio + tax;
  const colchon = (subtotal * Number(s.colchon_pct)) / 100;
  const totalUsd = subtotal + colchon;
  return {
    moneda, local: false, precio, envio, tax, colchon,
    precioEur: moneda === "EUR" ? precioOrig : null,
    envioEur: moneda === "EUR" ? envioOrig : null,
    totalUsd, totalBs: paralelo ? totalUsd * paralelo : null,
  };
}

/** Valor para comparar ofertas: en Bs si hay paralelo; si no, en USD */
function clave(c: Costo): number {
  return c.totalBs ?? c.totalUsd ?? Number.POSITIVE_INFINITY;
}

export type OfertaCalculada = { offer: Offer; costo: Costo | null };

export type Resumen = {
  /** Ofertas de la más barata a la más cara; agotadas y sin precio al final */
  ordenadas: OfertaCalculada[];
  /** La más barata que se puede comprar (con precio y con stock) */
  mejor: OfertaCalculada | null;
  /** Diferencia entre la más cara y la más barata disponibles */
  ahorroBs: number | null;
  ahorroUsd: number | null;
  estado: EstadoTarjeta;
  tiendas: number;
};

export function resumir(p: Product, s: Settings, paralelo: number | null, euroUsd: number | null = null): Resumen {
  const calc = p.offers.map((offer) => ({ offer, costo: costoOferta(offer, s, paralelo, euroUsd) }));
  const peso = (x: OfertaCalculada) => (x.costo == null ? 2 : x.offer.status === "AGOTADO" ? 1 : 0);
  const ordenadas = [...calc].sort(
    (a, b) => peso(a) - peso(b) || (a.costo ? clave(a.costo) : 0) - (b.costo ? clave(b.costo) : 0),
  );
  const disponibles = ordenadas.filter((x) => x.costo && x.offer.status !== "AGOTADO");
  const mejor = disponibles[0] ?? null;
  const cara = disponibles.length >= 2 ? disponibles[disponibles.length - 1].costo! : null;
  const barata = mejor?.costo ?? null;
  const ahorroBs = cara && barata && cara.totalBs != null && barata.totalBs != null ? cara.totalBs - barata.totalBs : null;
  const ahorroUsd = cara && barata && cara.totalUsd != null && barata.totalUsd != null ? cara.totalUsd - barata.totalUsd : null;

  let estado: EstadoTarjeta;
  if (mejor) estado = mejor.offer.status === "OFERTA" ? "OFERTA" : "EN STOCK";
  else if (p.offers.length && p.offers.every((o) => o.status === "AGOTADO")) estado = "AGOTADO";
  else if (calc.some((x) => x.costo)) estado = "AGOTADO";
  else estado = "SIN PRECIO";

  return { ordenadas, mejor, ahorroBs, ahorroUsd, estado, tiendas: new Set(p.offers.map((o) => o.store)).size };
}

/** Imagen de la tarjeta: la propia, o la de su mejor oferta, o la de cualquier oferta. */
export function imagenDe(p: Product, r?: Resumen): string | null {
  return p.image_url ?? r?.mejor?.offer.image_url ?? p.offers.find((o) => o.image_url)?.image_url ?? null;
}

export function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function simbolo(m: Moneda | null | undefined): string {
  return m === "BOB" ? "Bs" : m === "EUR" ? "€" : "$";
}

/** "$ 70,00" · "Bs 480,00" · "€ 65,00" */
export function precio(m: Moneda | null | undefined, n: number | null | undefined): string {
  return `${simbolo(m)} ${money(n)}`;
}

export function codigo(id: number): string {
  return "NP-" + String(id).padStart(3, "0");
}

export function fechaCorta(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit" });
}
