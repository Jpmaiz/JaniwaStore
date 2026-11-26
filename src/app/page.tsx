import type { Metadata } from "next";
import { cargarVitrina, numeroWhatsApp } from "@/lib/tienda";
import Tienda from "@/components/Tienda";

// La tienda se actualiza sola cuando guardas cambios en el panel; además se refresca cada minuto
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Janiwa · Productos de EE. UU. en Bolivia",
  description: "Productos de EE. UU. por encargo en Cochabamba. Elige y coordina por WhatsApp.",
};

export default async function Inicio() {
  const { productos, error } = await cargarVitrina();
  return <Tienda productos={productos} numero={numeroWhatsApp()} error={error} />;
}
