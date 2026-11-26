import type { ProductoPublico } from "./types";
import { adivinarTipo, delGenero } from "./catalogo";

export type Outfit = { id: string; genero: "mujer" | "hombre"; prendas: ProductoPublico[]; total: number };

type Rol = "arriba" | "abrigo" | "abajo" | "entero" | "pies" | "extra" | null;

function rol(p: ProductoPublico): Rol {
  if (p.category === "ZAPATILLAS") return "pies";
  if (p.category === "ACCESORIOS") return "extra";
  if (p.category !== "ROPA") return null;
  const t = p.subcategoria ?? adivinarTipo(p.name);
  if (t === "vestidos") return "entero";
  if (t === "chamarras") return "abrigo";
  if (t && ["jeans", "pantalones", "shorts", "buzos"].includes(t)) return "abajo";
  return "arriba"; // poleras, camisas, hoodies, chompas o sin definir
}

/**
 * Arma outfits sugeridos con lo publicado: una prenda base (arriba o vestido) y se le suma
 * parte de abajo, zapatillas y, a veces, chamarra o accesorio. Siempre igual para las mismas prendas.
 */
export function armarOutfits(productos: ProductoPublico[], maxPorGenero = 12): Outfit[] {
  const porGenero = (["mujer", "hombre"] as const).map((g) => {
    const pool = productos.filter((p) => delGenero(p, g));
    const de = (r: Rol) => pool.filter((p) => rol(p) === r);
    const bases = [...de("arriba"), ...de("entero")];
    const abajos = de("abajo");
    const pies = de("pies");
    const abrigos = de("abrigo");
    const extras = de("extra");
    const toma = <T,>(lista: T[], i: number) => (lista.length ? lista[i % lista.length] : null);

    const lista: Outfit[] = [];
    const vistos = new Set<string>();
    const sumar = (prendas: (ProductoPublico | null)[]) => {
      const ok = prendas.filter((p): p is ProductoPublico => !!p);
      const clave = ok.map((p) => p.id).sort((a, b) => a - b).join("-");
      if (ok.length < 2 || vistos.has(clave) || lista.length >= maxPorGenero) return;
      vistos.add(clave);
      lista.push({ id: `${g}-${clave}`, genero: g, prendas: ok, total: ok.reduce((s, p) => s + p.precio_venta_bs, 0) });
    };

    bases.forEach((base, i) => {
      const entero = rol(base) === "entero";
      sumar([
        base,
        entero ? null : toma(abajos, i),
        toma(pies, i),
        i % 2 === 0 ? toma(abrigos, i / 2) : null,
        i % 3 === 0 ? toma(extras, i / 3) : null,
      ]);
    });
    // sin prendas de arriba: abajo + zapatillas
    if (!bases.length) abajos.forEach((a, i) => sumar([a, toma(pies, i), toma(abrigos, i)]));
    return lista;
  });

  // intercalar mujer y hombre
  const [m, h] = porGenero;
  const feed: Outfit[] = [];
  for (let i = 0; i < Math.max(m.length, h.length); i++) {
    if (m[i]) feed.push(m[i]);
    if (h[i]) feed.push(h[i]);
  }
  return feed;
}
