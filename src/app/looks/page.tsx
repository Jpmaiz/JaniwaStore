import type { Metadata } from "next";
import { cargarVitrina, numeroWhatsApp } from "@/lib/tienda";
import { armarOutfits } from "@/lib/outfits";
import Marco from "@/components/Marco";
import FeedLooks from "@/components/FeedLooks";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Looks · Janiwa",
  description: "Ideas para combinar nuestras piezas únicas. Toca cada prenda para verla o agrega el look completo a tu bolsa.",
};

export default async function LooksPage() {
  const { productos } = await cargarVitrina();
  const looks = armarOutfits(productos, 20);
  return (
    <Marco productos={productos} numero={numeroWhatsApp()}>
      <section className="shop-title">
        <p className="small muted">IDEAS PARA COMBINAR · {looks.length} LOOKS</p>
        <h1>Looks</h1>
      </section>
      <FeedLooks looks={looks} />
    </Marco>
  );
}
