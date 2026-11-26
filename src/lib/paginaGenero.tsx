import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cargarVitrina, numeroWhatsApp } from "./tienda";
import { seccionesDe } from "./catalogo";
import Escaparate from "@/components/Escaparate";

type Props = { params: Promise<{ seccion?: string[] }> };

/** Lo comparten /mujer y /hombre (con o sin sección: /hombre/poleras) */
export function paginaGenero(genero: "mujer" | "hombre") {
  const nombre = genero === "mujer" ? "Mujer" : "Hombre";

  async function metadata({ params }: Props): Promise<Metadata> {
    const slug = (await params).seccion?.[0];
    const sec = seccionesDe(genero).find((s) => s.slug === slug);
    return { title: sec ? `${sec.nombre} · ${nombre} · Janiwa` : `${nombre} · Janiwa` };
  }

  async function Pagina({ params }: Props) {
    const partes = (await params).seccion ?? [];
    if (partes.length > 1) notFound();
    const slug = partes[0] ?? null;
    if (slug && !seccionesDe(genero).some((s) => s.slug === slug)) notFound();
    const { productos, error } = await cargarVitrina();
    return (
      <Escaparate productos={productos} vista={{ tipo: "genero", genero, seccion: slug }} numero={numeroWhatsApp()} error={error} />
    );
  }

  /** /mujer, /mujer/poleras, /mujer/jeans… se generan de antemano */
  function rutas() {
    return [{ seccion: [] as string[] }, ...seccionesDe(genero).map((s) => ({ seccion: [s.slug] }))];
  }

  return { metadata, Pagina, rutas };
}
