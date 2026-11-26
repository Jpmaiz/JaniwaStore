import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cargarProductoPublico, cargarVitrina, numeroWhatsApp } from "@/lib/tienda";
import { money } from "@/lib/calc";
import Marco from "@/components/Marco";
import FichaPublica from "@/components/FichaPublica";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

// Título, descripción e imagen para cuando compartes el link (WhatsApp, Instagram, etc.)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await cargarProductoPublico(Number((await params).id));
  if (!p) return { title: "Producto no disponible · Janiwa" };
  const titulo = [p.name, p.color].filter(Boolean).join(" · ");
  return {
    title: `${titulo} · Janiwa`,
    description: `Bs ${money(p.precio_venta_bs)} · ${p.disponibilidad === "stock" ? "En stock" : "Por encargo"} · Janiwa, Cochabamba`,
    openGraph: { title: titulo, description: `Bs ${money(p.precio_venta_bs)}`, images: p.image_url ? [p.image_url] : [] },
  };
}

export default async function ProductoPage({ params }: Props) {
  const [p, { productos }] = await Promise.all([cargarProductoPublico(Number((await params).id)), cargarVitrina()]);
  if (!p) notFound();
  return (
    <Marco productos={productos} numero={numeroWhatsApp()}>
      <nav className="migas" aria-label="Ruta">
        <Link href="/">← VOLVER A LA TIENDA</Link>
      </nav>
      <main className="sheet sheet-page">
        <FichaPublica producto={p} numero={numeroWhatsApp()} />
      </main>
    </Marco>
  );
}
