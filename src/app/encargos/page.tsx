import type { Metadata } from "next";
import Link from "next/link";
import { cargarVitrina, numeroWhatsApp } from "@/lib/tienda";
import { enlaceWhatsAppGeneral } from "@/lib/vitrina";
import Marco from "@/components/Marco";

export const revalidate = 60;
export const metadata: Metadata = { title: "Encargos USA ⇄ Bolivia · Janiwa" };

export default async function Encargos() {
  const { productos } = await cargarVitrina();
  const numero = numeroWhatsApp();
  return (
    <Marco productos={productos} numero={numero}>
      <section className="shop-title">
        <p className="small muted">
          SERVICIO · <span className="tag-pronto">PRONTO</span>
        </p>
        <h1>Encargos USA ⇄ Bolivia</h1>
      </section>
      <div className="encargos">
        <div className="encargo-card">
          <span className="how-n">EE. UU. → BOLIVIA</span>
          <h2>Lo que no está en la tienda</h2>
          <p className="muted">Pronto podrás pedirnos productos de tiendas de EE. UU. que no tengamos publicados.</p>
        </div>
        <div className="encargo-card">
          <span className="how-n">BOLIVIA → EE. UU.</span>
          <h2>Enviar desde Bolivia</h2>
          <p className="muted">Y también enviar productos de Bolivia a EE. UU.</p>
        </div>
      </div>
      <div className="actions" style={{ marginTop: 24 }}>
        {numero && (
          <a className="btn btn-primary" href={enlaceWhatsAppGeneral(numero)} target="_blank" rel="noreferrer">
            CONSULTAR POR WHATSAPP ↗
          </a>
        )}
        <Link href="/" className="btn">VOLVER A LA TIENDA</Link>
      </div>
    </Marco>
  );
}
