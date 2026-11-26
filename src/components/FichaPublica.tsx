"use client";

import { useEffect, useState } from "react";
import { registrarInteres } from "@/app/public-actions";
import { codigo, money } from "@/lib/calc";
import { enlaceWhatsApp, textoPieza } from "@/lib/vitrina";
import type { ProductoPublico } from "@/lib/types";
import Galeria from "./Galeria";

/** Detalle de un producto para el cliente: se usa en la ventana y en /producto/[id] */
export default function FichaPublica({
  producto: p,
  numero,
  cerrar,
}: {
  producto: ProductoPublico;
  numero: string | null;
  cerrar?: React.ReactNode;
}) {
  const [talla, setTalla] = useState<string | null>(p.tallas.length === 1 ? p.tallas[0] : null);
  const [copiado, setCopiado] = useState(false);
  // link completo del producto (con el dominio donde esté publicada la tienda)
  const [url, setUrl] = useState(`/producto/${p.id}`);
  useEffect(() => setUrl(`${window.location.origin}/producto/${p.id}`), [p.id]);
  const faltaTalla = p.tallas.length > 0 && !talla;
  const wa = numero ? enlaceWhatsApp(numero, p, talla, url) : null;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin permiso de portapapeles */
    }
  };

  return (
    <>
      <div className="sheet-media tex">
        <Galeria fotos={p.fotos} alt={p.color ? `${p.name}, color ${p.color}` : p.name} />
      </div>

      <div className="sheet-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 44 }}>
          <span className="small muted">
            {codigo(p.id)} · {p.category}
          </span>
          {cerrar}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3>{p.name}</h3>
          {p.color && <p className="small muted">{p.color.toUpperCase()}</p>}
        </div>

        <div className="total" style={{ borderTop: 0, paddingTop: 0 }}>
          <span className="label">{textoPieza(p)}</span>
          <span className="total-num">Bs {money(p.precio_venta_bs)}</span>
        </div>

        <p className="small muted unica">Solo hay una. Cuando se vende, no vuelve.</p>

        {p.tallas.length > 1 && (
          <fieldset className="tallas">
            <legend className="label">TALLA {talla ? `· ${talla}` : ""}</legend>
            <div className="tallas-lista">
              {p.tallas.map((t) => (
                <button key={t} type="button" className="talla" aria-pressed={talla === t} onClick={() => setTalla(t)}>
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {p.descripcion && <p className="desc">{p.descripcion}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {wa && !faltaTalla ? (
            <a
              className="btn btn-primary btn-wa"
              href={wa}
              target="_blank"
              rel="noreferrer"
              onClick={() => void registrarInteres(p.id)}
            >
              LO QUIERO · ESCRIBIR POR WHATSAPP ↗
            </a>
          ) : (
            <button type="button" className="btn btn-primary btn-wa" disabled>
              {!wa ? "WHATSAPP NO CONFIGURADO" : "ELIGE TU TALLA"}
            </button>
          )}
          <button type="button" className="btn" onClick={copiar}>
            {copiado ? "LINK COPIADO ✓" : "COPIAR LINK DEL PRODUCTO"}
          </button>
          <p className="small muted" style={{ lineHeight: 1.6 }}>
            El precio, el pago y la entrega se coordinan por WhatsApp.
          </p>
        </div>
      </div>
    </>
  );
}
