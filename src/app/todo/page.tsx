import type { Metadata } from "next";
import { cargarVitrina, numeroWhatsApp } from "@/lib/tienda";
import Escaparate from "@/components/Escaparate";

export const revalidate = 60;
export const metadata: Metadata = { title: "Ver todo · Janiwa" };

export default async function Todo() {
  const { productos, error } = await cargarVitrina();
  return <Escaparate productos={productos} vista={{ tipo: "todo" }} numero={numeroWhatsApp()} error={error} />;
}
