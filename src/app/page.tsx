import type { Metadata } from "next";
import { cargarVitrina, numeroWhatsApp } from "@/lib/tienda";
import Escaparate from "@/components/Escaparate";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Janiwa · Lo nuevo",
  description: "Ropa, zapatillas y accesorios de EE. UU. por encargo en Cochabamba. Elige y coordina por WhatsApp.",
};

export default async function Inicio() {
  const { productos, error } = await cargarVitrina();
  return <Escaparate productos={productos} vista={{ tipo: "nuevo" }} numero={numeroWhatsApp()} error={error} />;
}
