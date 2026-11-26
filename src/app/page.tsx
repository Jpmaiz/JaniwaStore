import type { Metadata } from "next";
import { cargarAnuncios, cargarVitrina, numeroWhatsApp } from "@/lib/tienda";
import Escaparate from "@/components/Escaparate";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Janiwa · Lo nuevo",
  description: "Ropa, zapatillas y accesorios originales en Cochabamba. Piezas únicas: una sola prenda por talla. Coordina por WhatsApp.",
};

export default async function Inicio() {
  const [{ productos, error }, anuncios] = await Promise.all([cargarVitrina(), cargarAnuncios()]);
  return <Escaparate productos={productos} vista={{ tipo: "nuevo" }} numero={numeroWhatsApp()} error={error} anuncios={anuncios} />;
}
