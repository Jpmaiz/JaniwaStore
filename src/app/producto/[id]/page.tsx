import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cargarProductoPublico, numeroWhatsApp } from "@/lib/tienda";
import { money } from "@/lib/calc";
import Marca from "@/components/Marca";
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
  const p = await cargarProductoPublico(Number((await params).id));
  if (!p) notFound();

  return (
    <div className="shop">
      <header className="shop-head">
        <Link href="/" aria-label="Janiwa, inicio" className="shop-brand">
          <Marca subtitulo="PRODUCTOS DE EE. UU." />
        </Link>
        <nav className="shop-nav" aria-label="Principal">
          <Link href="/">← VER TODO</Link>
        </nav>
      </header>
      <main className="sheet sheet-page">
        <FichaPublica producto={p} numero={numeroWhatsApp()} />
      </main>
    </div>
  );
}
