import type { Metadata } from "next";
import { cargarDatos, cargarTiendas } from "@/lib/datos";
import { obtenerDolar } from "@/lib/dolar";
import Stores from "@/components/Stores";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tiendas · Nerdie" };

export default async function TiendasPage() {
  const [datos, dolar] = await Promise.all([cargarDatos(), obtenerDolar()]);
  const tiendas = datos.error ? { stores: [], error: datos.error } : await cargarTiendas(datos.products);
  return (
    <Stores
      stores={tiendas.stores}
      products={datos.products}
      settings={datos.settings}
      paralelo={datos.settings.paralelo_manual ?? dolar.paralelo}
      euroUsd={datos.settings.eur_usd_manual ?? dolar.euroUsd}
      error={tiendas.error}
    />
  );
}
