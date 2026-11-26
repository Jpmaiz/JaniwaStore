import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cargarVitrina, numeroWhatsApp } from "@/lib/tienda";
import { CATEGORIAS_SLUG, nombreCategoria } from "@/lib/catalogo";
import Escaparate from "@/components/Escaparate";

export const revalidate = 60;
type Props = { params: Promise<{ categoria: string }> };

export function generateStaticParams() {
  return Object.keys(CATEGORIAS_SLUG).map((categoria) => ({ categoria }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = CATEGORIAS_SLUG[(await params).categoria];
  return { title: cat ? `${nombreCategoria(cat)} · Janiwa` : "Janiwa" };
}

export default async function Categoria({ params }: Props) {
  const cat = CATEGORIAS_SLUG[(await params).categoria];
  if (!cat) notFound();
  const { productos, error } = await cargarVitrina();
  return <Escaparate productos={productos} vista={{ tipo: "categoria", categoria: cat }} numero={numeroWhatsApp()} error={error} />;
}
