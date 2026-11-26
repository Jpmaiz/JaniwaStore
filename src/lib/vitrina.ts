import type { ProductoPublico } from "./types";
import { codigo, money } from "./calc";

const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

/** "2026-12-20" → "20 DIC" (sin líos de zona horaria) */
export function fechaCorta(iso: string | null): string | null {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${Number(m[3])} ${MESES[Number(m[2]) - 1]}` : null;
}

/** Cada prenda es una sola: "PIEZA ÚNICA · TALLA M" */
export function textoPieza(p: ProductoPublico): string {
  return p.tallas.length ? `PIEZA ÚNICA · TALLA ${p.tallas.join(" / ")}` : "PIEZA ÚNICA";
}

/** Etiqueta corta para la tarjeta: "TALLA M" */
export function etiquetaTalla(p: ProductoPublico): string {
  return p.tallas.length ? `TALLA ${p.tallas.join(" / ")}` : "PIEZA ÚNICA";
}

/** Link de WhatsApp con el mensaje ya escrito */
export function enlaceWhatsApp(numero: string, p: ProductoPublico, talla: string | null, url: string): string {
  const partes = [codigo(p.id), p.name, p.color, talla ? `Talla ${talla}` : null].filter(Boolean).join(" · ");
  const texto = `Hola Janiwa, me interesa este producto:\n${partes}\nPrecio: Bs ${money(p.precio_venta_bs)}\n${url}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export function enlaceWhatsAppGeneral(numero: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent("Hola Janiwa, quiero consultar por un producto.")}`;
}

export type ItemBolsa = { id: number; name: string; color: string | null; tallas: string[]; precio: number; foto: string | null };

/** Mensaje de WhatsApp con todas las prendas de la bolsa */
export function enlaceWhatsAppBolsa(numero: string, items: ItemBolsa[], origen: string): string {
  const lineas = items.map((p, i) => {
    const datos = [codigo(p.id), p.name, p.color, p.tallas.length ? `Talla ${p.tallas.join("/")}` : null].filter(Boolean).join(" · ");
    return `${i + 1}. ${datos} · Bs ${money(p.precio)}\n   ${origen}/producto/${p.id}`;
  });
  const total = items.reduce((s, p) => s + p.precio, 0);
  const texto =
    `Hola Janiwa, quiero ${items.length === 1 ? "esta prenda" : `estas ${items.length} prendas`}:\n\n` +
    `${lineas.join("\n")}\n\nTotal: Bs ${money(total)}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
