import type { Metadata } from "next";
import { cargarVitrina, numeroWhatsApp } from "@/lib/tienda";
import { armarOutfits } from "@/lib/outfits";
import Marco from "@/components/Marco";
import FeedOutfits from "@/components/FeedOutfits";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Outfits · Janiwa",
  description: "Outfits armados con nuestras piezas únicas. Toca cada prenda para verla o agrega el outfit completo a tu bolsa.",
};

export default async function OutfitsPage() {
  const { productos } = await cargarVitrina();
  const outfits = armarOutfits(productos);
  return (
    <Marco productos={productos} numero={numeroWhatsApp()}>
      <section className="shop-title">
        <p className="small muted">IDEAS PARA COMBINAR · {outfits.length} OUTFITS</p>
        <h1>Outfits</h1>
      </section>
      <FeedOutfits outfits={outfits} />
    </Marco>
  );
}
