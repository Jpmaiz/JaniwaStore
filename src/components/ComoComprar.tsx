"use client";

import { useId, useState } from "react";
import { enlaceWhatsAppGeneral } from "@/lib/vitrina";
import { IconoCamara, IconoChat } from "./Iconos";

const PASOS = [
  ["Elige", "tu prenda: cada una es única, en una sola talla."],
  ["Escríbenos", "el botón abre WhatsApp con tu pedido."],
  ["Coordinamos", "el pago y la entrega contigo."],
] as const;

/** Instagram desde NEXT_PUBLIC_INSTAGRAM: acepta "janiwa", "@janiwa" o el link completo */
function enlaceInstagram(): string | null {
  const v = (process.env.NEXT_PUBLIC_INSTAGRAM ?? "").trim();
  if (!v) return null;
  const usuario = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?#].*$/, "");
  return /^[\w.]{1,30}$/.test(usuario) ? `https://instagram.com/${usuario}` : null;
}

/** "Cómo comprar" desplegable: el panel se abre como telón y los pasos entran uno tras otro */
export default function ComoComprar({ numero }: { numero: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const instagram = enlaceInstagram();

  return (
    <section className={`como${abierto ? " is-abierto" : ""}`}>
      <button type="button" className="como-cabeza" aria-expanded={abierto} aria-controls={id} onClick={() => setAbierto((v) => !v)}>
        <h2>Cómo comprar</h2>
        <span className="como-icono" aria-hidden="true" />
      </button>

      <div id={id} className="como-panel" inert={!abierto}>
        <div className="como-dentro">
          <ol>
            {PASOS.map(([verbo, resto], i) => (
              <li key={verbo} style={{ "--i": i } as React.CSSProperties}>
                <span className="como-n">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <b>{verbo}</b> {resto}
                </span>
              </li>
            ))}
          </ol>

          {(numero || instagram) && (
            <div className="como-links" style={{ "--i": PASOS.length } as React.CSSProperties}>
              <span className="small">¿DUDAS? ESCRÍBENOS</span>
              <div>
                {numero && (
                  <a href={enlaceWhatsAppGeneral(numero)} target="_blank" rel="noreferrer">
                    <IconoChat /> WHATSAPP ↗
                  </a>
                )}
                {instagram && (
                  <a href={instagram} target="_blank" rel="noreferrer">
                    <IconoCamara /> INSTAGRAM ↗
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
