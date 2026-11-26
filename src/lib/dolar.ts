import type { Dolar } from "./types";

type Cotizacion = { casa: string; compra: number; venta: number; fechaActualizacion: string };

/** Dólar oficial y paralelo (Binance) en Bolivia, desde dolarapi. Caché 15 min. */
async function dolarBolivia(): Promise<Omit<Dolar, "euroUsd">> {
  try {
    const res = await fetch("https://bo.dolarapi.com/v1/dolares", { next: { revalidate: 900 } });
    if (!res.ok) throw new Error(`dolarapi ${res.status}`);
    const data = (await res.json()) as Cotizacion[];
    const oficial = data.find((d) => d.casa === "oficial");
    const binance = data.find((d) => d.casa === "binance");
    return {
      oficial: oficial?.venta ?? null,
      paralelo: binance?.venta ?? null,
      actualizado: binance?.fechaActualizacion ?? oficial?.fechaActualizacion ?? null,
    };
  } catch {
    return { oficial: null, paralelo: null, actualizado: null };
  }
}

const tasa = (v: unknown) => (typeof v === "number" && v > 0.2 && v < 5 ? v : null);

/** Euro → dólar del Banco Central Europeo (api.frankfurter.dev, gratis y sin clave). Caché 6 h. */
async function euroDolar(): Promise<number | null> {
  const intentos: [string, (d: Record<string, unknown>) => number | null][] = [
    ["https://api.frankfurter.dev/v2/rate/eur/usd", (d) => tasa(d.rate)],
    ["https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD", (d) => tasa((d.rates as Record<string, unknown> | undefined)?.USD)],
    ["https://api.frankfurter.app/latest?from=EUR&to=USD", (d) => tasa((d.rates as Record<string, unknown> | undefined)?.USD)],
  ];
  for (const [url, leer] of intentos) {
    try {
      const res = await fetch(url, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const v = leer((await res.json()) as Record<string, unknown>);
      if (v) return v;
    } catch {
      /* probamos la siguiente */
    }
  }
  return null;
}

export async function obtenerDolar(): Promise<Dolar> {
  const [dolar, euroUsd] = await Promise.all([dolarBolivia(), euroDolar()]);
  return { ...dolar, euroUsd };
}
