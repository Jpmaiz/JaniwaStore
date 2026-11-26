import { cargarDatos } from "@/lib/datos";
import { obtenerDolar } from "@/lib/dolar";
import Wishlist from "@/components/Wishlist";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ products, settings, error }, dolar] = await Promise.all([cargarDatos(), obtenerDolar()]);
  return <Wishlist products={products} settings={settings} dolar={dolar} error={error} />;
}
