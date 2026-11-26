"use client";

import { useRef, useState } from "react";
import { IconoDerecha, IconoIzquierda } from "./Iconos";

/** Fotos del producto: se deslizan con el dedo; en la compu, flechas y puntitos */
export default function Galeria({ fotos, alt }: { fotos: string[]; alt: string }) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="placeholder" style={{ position: "absolute", inset: 0, fontSize: 11 }}>
        [ SIN IMAGEN ]
      </div>
    );
  }

  const ir = (i: number) => {
    const el = pista.current;
    if (!el) return;
    const destino = (i + fotos.length) % fotos.length;
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: destino * el.clientWidth, behavior: suave ? "smooth" : "auto" });
  };

  return (
    <div className="galeria" role="group" aria-roledescription="galería" aria-label={`Fotos de ${alt}`}>
      <div
        ref={pista}
        className="galeria-pista"
        onScroll={(e) => {
          const el = e.currentTarget;
          setActual(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
      >
        {fotos.map((f, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={f} src={f} alt={fotos.length > 1 ? `${alt} · foto ${i + 1} de ${fotos.length}` : alt} loading={i === 0 ? "eager" : "lazy"} />
        ))}
      </div>
      {fotos.length > 1 && (
        <>
          <button type="button" className="galeria-flecha izq" onClick={() => ir(actual - 1)} aria-label="Foto anterior">
            <IconoIzquierda />
          </button>
          <button type="button" className="galeria-flecha der" onClick={() => ir(actual + 1)} aria-label="Foto siguiente">
            <IconoDerecha />
          </button>
          <div className="galeria-puntos">
            {fotos.map((f, i) => (
              <button key={f} type="button" aria-label={`Ver foto ${i + 1}`} aria-current={i === actual} onClick={() => ir(i)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
