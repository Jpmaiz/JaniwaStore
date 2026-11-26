"use client";

import type { Product } from "@/lib/types";
import type { Resumen } from "@/lib/calc";
import { codigo, imagenDe, money } from "@/lib/calc";
import { PIXELES_ENTRADA, PIXELES_EXPLOSION, type Efecto, type Pixel } from "@/lib/arcade";

// Alturas de respaldo para productos sin imagen (da el ritmo tipo Pinterest)
const ALTURAS = [300, 360, 260, 400, 320, 280, 380];

function Pixeles({ lista, clase }: { lista: Pixel[]; clase: string }) {
  return (
    <>
      {lista.map((p, i) => (
        <i
          key={i}
          className={`px ${clase}`}
          style={
            {
              "--x": `${p.x}px`,
              "--y": `${p.y}px`,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--s": `${p.s}px`,
              "--c": p.c,
              animationDelay: clase === "px-out" ? `calc(0.45s + ${(i % 4) * 0.03}s)` : `${(i % 5) * 0.03}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}

export default function Tile({
  product,
  resumen,
  efecto,
  onOpen,
}: {
  product: Product;
  resumen: Resumen;
  efecto?: Efecto;
  onOpen: () => void;
}) {
  const img = imagenDe(product, resumen);
  const totalBs = resumen.mejor?.costo?.totalBs ?? null;
  const estado = resumen.estado;
  const claseTile = efecto === "entrar" ? "arcade-in" : efecto === "explotar" ? "arcade-out" : efecto === "mas1" ? "arcade-up" : "";

  return (
    <div id={`tile-${product.id}`} className={`tile-wrap ${efecto ? "fx-" + efecto : ""}`}>
      <button
        className={`tile tex ${claseTile}`}
        onClick={onOpen}
        tabIndex={efecto === "explotar" ? -1 : undefined}
        aria-label={`Ver ${product.name}${product.color ? " " + product.color : ""}`}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" />
        ) : (
          <div className="placeholder" style={{ height: ALTURAS[product.id % ALTURAS.length] }}>
            [ SIN IMAGEN ]
          </div>
        )}
        <span className="tile-code">{codigo(product.id)}</span>
        {estado !== "EN STOCK" && <span className={`badge badge-${estado.replace(" ", "-")}`}>{estado}</span>}
        {resumen.tiendas > 1 && <span className="tile-stores">{resumen.tiendas} TIENDAS</span>}
        <span className="cap">
          <span className="cap-name">{product.name}</span>
          <span className="small muted">
            {product.color ? `${product.color.toUpperCase()} · ` : ""}
            {totalBs != null ? `DESDE Bs ${money(totalBs)}` : "SIN PRECIO"}
          </span>
        </span>
      </button>

      {/* Efectos arcade */}
      {efecto === "entrar" && (
        <>
          <span className="fx-scan" aria-hidden="true" />
          <span className="fx" aria-hidden="true">
            <Pixeles lista={PIXELES_ENTRADA} clase="px-in" />
            <span className="fx-text fx-new">¡NUEVO!</span>
          </span>
        </>
      )}
      {efecto === "mas1" && (
        <span className="fx" aria-hidden="true">
          <span className="fx-text fx-new fx-new-ya">+1 TIENDA</span>
        </span>
      )}
      {efecto === "explotar" && (
        <>
          <span className="fx-flash" aria-hidden="true" />
          <span className="fx" aria-hidden="true">
            <span className="fx-ring" />
            <span className="fx-ring fx-ring-2" />
            <Pixeles lista={PIXELES_EXPLOSION} clase="px-out" />
            <span className="fx-text fx-boom">¡BOOM!</span>
          </span>
        </>
      )}
    </div>
  );
}
