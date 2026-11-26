import { cargarDatos } from "@/lib/datos";
import { requireAdmin } from "@/lib/auth";
import { obtenerDolar } from "@/lib/dolar";
import Wishlist from "@/components/Wishlist";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wishlist · Janiwa", robots: { index: false } };

export default async function Home() {
  await requireAdmin();
  const [{ products, settings, error }, dolar] = await Promise.all([cargarDatos(), obtenerDolar()]);
  return <Wishlist products={products} settings={settings} dolar={dolar} error={error} />;
}
