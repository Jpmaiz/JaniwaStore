export const CATEGORIES = [
  "ZAPATILLAS",
  "ROPA",
  "SKATE",
  "ACCESORIOS",
  "TECNOLOGÍA",
  "DEPORTES",
  "HOGAR",
  "BELLEZA",
  "COLECCIONABLES",
  "OTROS",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ["EN STOCK", "AGOTADO", "OFERTA"] as const;
export type Status = (typeof STATUSES)[number];

export const MONEDAS = ["USD", "BOB", "EUR"] as const;
export type Moneda = (typeof MONEDAS)[number];

/** Estado de una tarjeta, calculado a partir de sus ofertas */
export type EstadoTarjeta = Status | "SIN PRECIO";

/** El mismo producto en una tienda concreta */
export type Offer = {
  id: number;
  product_id: number;
  created_at: string;
  url: string | null;
  store: string;
  /** Precio y envío están en `currency` (los nombres de columna son antiguos) */
  price_usd: number | null;
  shipping_usd: number;
  currency: Moneda;
  status: Status;
  image_url: string | null;
  checked_at: string | null;
  check_error: string | null;
};

/** Una tarjeta = un modelo + un color */
export type Product = {
  id: number;
  created_at: string;
  name: string;
  color: string | null;
  category: string;
  image_url: string | null;
  destino: "venta" | "personal";
  notes: string | null;
  offers: Offer[];
  /* Venta (tienda pública) */
  publicado: boolean;
  precio_venta_bs: number | null;
  precio_minimo_bs: number | null;
  tallas: string[];
  disponibilidad: Disponibilidad;
  llegada_estimada: string | null;
  descripcion: string | null;
  interes: number;
};

export type Disponibilidad = "stock" | "encargo";

/** Lo ÚNICO que ve un cliente: nada de costos, tiendas de origen ni márgenes */
export type ProductoPublico = {
  id: number;
  name: string;
  color: string | null;
  category: string;
  image_url: string | null;
  precio_venta_bs: number;
  tallas: string[];
  disponibilidad: Disponibilidad;
  llegada_estimada: string | null;
  descripcion: string | null;
};

export type Settings = {
  tax_pct: number;
  colchon_pct: number;
  paralelo_manual: number | null;
  eur_usd_manual: number | null;
};

export type Dolar = {
  oficial: number | null;
  paralelo: number | null;
  actualizado: string | null;
  /** 1 euro = X dólares (Banco Central Europeo) */
  euroUsd: number | null;
};

/** Tienda que visitas, con lo que te interesa de ella */
export type Store = {
  id: number | null; // null = aparece en tus ofertas pero aún no tiene ficha guardada
  name: string;
  url: string | null;
  intereses: string[];
  notes: string | null;
  favorita: boolean;
};
