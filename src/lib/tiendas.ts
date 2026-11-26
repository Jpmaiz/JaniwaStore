/**
 * Tiendas conocidas: nombre que se muestra y envío estimado dentro de USA (USD).
 * Los envíos son promedios aproximados; cámbialos aquí cuando conozcas los tuyos.
 */
const TIENDAS: { dominio: string; nombre: string; envio: number }[] = [
  { dominio: "amazon.com", nombre: "AMAZON", envio: 0 },
  { dominio: "stockx.com", nombre: "STOCKX", envio: 15 },
  { dominio: "goat.com", nombre: "GOAT", envio: 15 },
  { dominio: "urbanoutfitters.com", nombre: "URBAN OUTFITTERS", envio: 10 },
  { dominio: "adidas.com", nombre: "ADIDAS", envio: 8 },
  { dominio: "nike.com", nombre: "NIKE", envio: 8 },
  { dominio: "vans.com", nombre: "VANS", envio: 8 },
  { dominio: "converse.com", nombre: "CONVERSE", envio: 8 },
  { dominio: "newbalance.com", nombre: "NEW BALANCE", envio: 8 },
  { dominio: "zappos.com", nombre: "ZAPPOS", envio: 0 },
  { dominio: "footlocker.com", nombre: "FOOT LOCKER", envio: 8 },
  { dominio: "champssports.com", nombre: "CHAMPS", envio: 8 },
  { dominio: "finishline.com", nombre: "FINISH LINE", envio: 8 },
  { dominio: "journeys.com", nombre: "JOURNEYS", envio: 8 },
  { dominio: "ebay.com", nombre: "EBAY", envio: 10 },
  { dominio: "walmart.com", nombre: "WALMART", envio: 0 },
  { dominio: "target.com", nombre: "TARGET", envio: 0 },
  { dominio: "bestbuy.com", nombre: "BEST BUY", envio: 0 },
  { dominio: "macys.com", nombre: "MACY'S", envio: 10 },
  { dominio: "nordstrom.com", nombre: "NORDSTROM", envio: 0 },
  { dominio: "shein.com", nombre: "SHEIN", envio: 5 },
];

const ENVIO_DESCONOCIDA = 10;

import type { Moneda } from "./types";

// Dominios de países que cobran en euros
const DOMINIOS_EURO = ["es", "de", "fr", "it", "nl", "pt", "be", "at", "ie", "fi", "gr", "eu"];

/** Moneda probable según el dominio (ej. ".bo" → Bs, ".es" → €) */
export function monedaDelDominio(host: string): Moneda {
  const tld = host.split(".").pop() ?? "";
  if (tld === "bo") return "BOB";
  if (DOMINIOS_EURO.includes(tld)) return "EUR";
  return "USD";
}

/** Saca la tienda, su envío estimado y su moneda probable a partir del link. */
export function detectarTienda(url: string): { store: string; envio: number; moneda: Moneda } | null {
  let host: string;
  try {
    host = new URL(url.trim()).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  const moneda = monedaDelDominio(host);
  const conocida = TIENDAS.find((t) => host === t.dominio || host.endsWith("." + t.dominio));
  if (conocida) return { store: conocida.nombre, envio: moneda === "BOB" ? 0 : conocida.envio, moneda };

  // Tienda nueva: usamos el nombre del dominio (ej. "shop.kith.com" → "KITH", "tienda.com.bo" → "TIENDA")
  const partes = host.split(".").filter((x) => !["com", "co", "net", "org", "shop", "store"].includes(x));
  const sinPais = partes.length >= 2 ? partes.slice(0, -1) : partes;
  const base = sinPais[sinPais.length - 1] ?? host;
  return { store: base.replace(/[-_]+/g, " ").toUpperCase(), envio: moneda === "BOB" ? 0 : ENVIO_DESCONOCIDA, moneda };
}

/**
 * Palabras clave por categoría (en inglés y español, sin tildes).
 * El orden importa cuando hay empate: "skate shoes" → ZAPATILLAS, "skate tee" → ROPA.
 */
const PALABRAS: [string, RegExp][] = [
  ["ZAPATILLAS", /\b(shoes?|sneakers?|zapatillas?|zapatos?|tenis|trainers?|old skool|sk8 hi|slip on|authentic|dunks?|jordan|air max|air force|samba|gazelle|campus|superstar|forum low|chuck taylor|chuck 70|550|530|9060|990v\d|boots?|botas?|botines?|slides?|sandals?|sandalias?|clogs?|crocs|loafers?|mules?|cleats?|chimpunes)\b/],
  ["ROPA", /\b(shirts?|t shirt|tees?|poleras?|camisetas?|camisas?|hoodies?|sudaderas?|sweatshirts?|sweaters?|chompas?|jackets?|chamarras?|chaquetas?|coats?|abrigos?|jeans?|pants?|pantalon(es)?|shorts?|dress(es)?|vestidos?|skirts?|faldas?|crewnecks?|polos?|vests?|chalecos?|joggers?|cargos?|fleece|cardigans?|overalls?|boxers?|underwear|leggings?|parkas?|windbreakers?)\b/],
  ["TECNOLOGÍA", /\b(airpods|headphones|audifonos|auriculares|earbuds|speakers?|parlantes?|kindle|tablets?|ipad|iphone|macbook|laptops?|cameras?|camaras?|instax|gopro|consoles?|consolas?|playstation|ps5|xbox|nintendo|steam deck|controllers?|mandos?|keyboards?|teclados?|mouse|chargers?|cargadores?|monitors?|smartwatch|apple watch|jbl|bose|beats|power ?bank|ssd)\b/],
  ["SKATE", /\b(skateboards?|skate decks?|skate|skating|skater|patinetas?|tablas?|decks?|trucks?|ruedas de skate|skate wheels|wheels \d{2}mm|\d{2}mm wheels|bearings?|rulemanes|rodamientos|grip ?tape|lija|longboards?|cruiser boards?|bushings?|deck \d)\b/],
  ["DEPORTES", /\b(balls?|balon(es)?|pelotas?|basketball|football|soccer|futbol|gym|dumbbells?|mancuernas?|yoga|rackets?|raquetas?|bikes?|bicicletas?|helmets?|cascos?|knee pads?|rodilleras|coderas|protectores|guantes de box|boxing)\b/],
  ["ACCESORIOS", /\b(caps?|gorras?|hats?|sombreros?|beanies?|gorros?|bags?|bolsos?|mochilas?|backpacks?|wallets?|billeteras?|belts?|cinturon(es)?|socks?|medias|calcetines|sunglasses|lentes|gafas|watch(es)?|relojes?|tumblers?|termos?|bottles?|botellas?|quencher|stanley|keychains?|llaveros?|totes?|scarf|bufandas?|gloves|guantes|necklaces?|collares?|rings?|anillos?|bracelets?|pulseras?|jewelry|joyas?)\b/],
  ["HOGAR", /\b(lamps?|lamparas?|mugs?|tazas?|blankets?|mantas?|frazadas?|pillows?|almohadas?|posters?|decor|decoracion|candles?|velas?|kitchen|cocina|rugs?|alfombras?)\b/],
  ["BELLEZA", /\b(perfumes?|fragrance|colonia|cologne|eau de (parfum|toilette)|skincare|serum|cremas?|cream|lipstick|labial|maquillaje|makeup|shampoo|champu)\b/],
  ["COLECCIONABLES", /\b(funko|lego|figures?|figuras?|action figure|trading cards?|cartas|pokemon|collectibles?|coleccionables?|toys?|juguetes?|plush|peluches?|hot wheels)\b/],
];

/**
 * Adivina la categoría. Suma puntos por coincidencias:
 *  - en las pistas de la tienda (ruta de categorías, tipo de producto) valen más
 *  - en el nombre del producto
 * Si no reconoce nada devuelve null (el formulario usa "OTROS").
 */
export function adivinarCategoria(nombre: string, pistas: string[] = []): string | null {
  const n = normalizar(nombre);
  const p = pistas.map(normalizar).filter(Boolean);
  let mejor: string | null = null;
  let puntos = 0;
  for (const [cat, re] of PALABRAS) {
    const total = (re.test(n) ? 2 : 0) + p.reduce((s, t) => s + (re.test(t) ? 3 : 0), 0);
    if (total > puntos) {
      mejor = cat;
      puntos = total;
    }
  }
  return mejor;
}

/** Texto sin tildes, minúsculas y sin símbolos, para comparar nombres. */
export function normalizar(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Palabras que no ayudan a distinguir un modelo
const RELLENO = new Set([
  "shoe", "shoes", "sneaker", "sneakers", "unisex", "men", "mens", "man", "women", "womens", "woman",
  "kids", "kid", "adult", "adults", "the", "and", "for", "with", "de", "para", "hombre", "mujer", "tm", "s",
]);

function palabras(s: string): Set<string> {
  return new Set(normalizar(s).split(" ").filter((w) => w && !RELLENO.has(w)));
}

/**
 * ¿Es el mismo modelo y el mismo color? (para unir ofertas en una tarjeta)
 * Mismo modelo = todas las palabras del nombre más corto están en el más largo
 * ("Old Skool Shoe" ≈ "Vans Old Skool"). Igual siempre preguntamos antes de unir.
 */
export function mismoProducto(p: { name: string; color: string | null }, name: string, color: string | null): boolean {
  const a = palabras(p.name);
  const b = palabras(name);
  const [corto, largo] = a.size <= b.size ? [a, b] : [b, a];
  if (corto.size < 2 && !(corto.size === 1 && largo.size === 1)) return false;
  const mismoNombre = [...corto].every((w) => largo.has(w));
  return mismoNombre && normalizar(p.color) === normalizar(color);
}

/** Links de búsqueda rápida con el modelo y color ya escritos. */
export function enlacesBusqueda(name: string, color: string | null): { nombre: string; url: string }[] {
  const q = encodeURIComponent([name, color].filter(Boolean).join(" "));
  return [
    { nombre: "GOOGLE SHOPPING", url: `https://www.google.com/search?tbm=shop&q=${q}` },
    { nombre: "AMAZON", url: `https://www.amazon.com/s?k=${q}` },
    { nombre: "EBAY", url: `https://www.ebay.com/sch/i.html?_nkw=${q}` },
    { nombre: "STOCKX", url: `https://stockx.com/search?s=${q}` },
    { nombre: "ZAPPOS", url: `https://www.zappos.com/search?term=${q}` },
    { nombre: "URBAN OUTFITTERS", url: `https://www.urbanoutfitters.com/search?q=${q}` },
  ];
}
