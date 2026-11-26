"use client";

import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/calc";
import type { Outfit } from "@/lib/outfits";
import { useBolsa } from "./Bolsa";

type Filtro = "todos" | "mujer" | "hombre";
const FORMAS = ["4 / 5", "2 / 3", "1 / 1", "3 / 4", "9 / 14", "4 / 5", "5 / 6"];

/** Looks en grilla tipo Pinterest: foto principal, miniaturas del resto y links pequeños debajo */
export default function FeedLooks({ looks }: { looks: Outfit[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const lista = filtro === "todos" ? looks : looks.filter((o) => o.genero === filtro);

  return (
    <>
      <nav className="shop-chips" aria-label="Filtrar looks">
        {(["todos", "mujer", "hombre"] as const).map((f) => (
          <button key={f} type="button" className="chip" aria-current={filtro === f ? "page" : undefined} onClick={() => setFiltro(f)}>
            {f === "todos" ? "TODOS" : f.toUpperCase()}
          </button>
        ))}
      </nav>

      {lista.length === 0 ? (
        <div className="empty">
          <h2 style={{ fontSize: 24 }}>Muy pronto</h2>
          <p className="muted">Cuando haya más prendas publicadas, aquí aparecen looks armados con ellas.</p>
        </div>
      ) : (
        <div className="pines">
          {lista.map((o, i) => (
            <Pin key={o.id} o={o} n={looks.indexOf(o) + 1} forma={FORMAS[i % FORMAS.length]} prioridad={i < 4} />
          ))}
        </div>
      )}
    </>
  );
}

function Pin({ o, n, forma, prioridad }: { o: Outfit; n: number; forma: string; prioridad: boolean }) {
  const bolsa = useBolsa();
  const faltan = o.prendas.filter((p) => !bolsa.tiene(p.id));
  const [principal, ...resto] = o.prendas;

  return (
    <article className="pin" aria-label={`Look ${n}, ${o.prendas.length} prendas, Bs ${money(o.total)}`}>
      <div className="pin-foto">
        <Link href={`/producto/${principal.id}`} className="pin-main tex" style={{ aspectRatio: forma }} aria-label={principal.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {principal.image_url && <img src={principal.image_url} alt="" loading={prioridad ? "eager" : "lazy"} />}
        </Link>
        {resto.length > 0 && (
          <div className="pin-minis" style={{ gridTemplateColumns: `repeat(${resto.length}, 1fr)` }}>
            {resto.map((p) => (
              <Link key={p.id} href={`/producto/${p.id}`} className="tex" aria-label={p.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image_url && <img src={p.image_url} alt="" loading="lazy" />}
              </Link>
            ))}
          </div>
        )}
        <button
          type="button"
          className={`pin-agregar${faltan.length === 0 ? " is-listo" : ""}`}
          onClick={() => (faltan.length ? bolsa.agregar(faltan) : bolsa.abrir())}
        >
          {faltan.length === 0 ? "EN TU BOLSA ✓" : "AGREGAR"}
        </button>
        <span className="pin-total">Bs {money(o.total)}</span>
      </div>

      <div className="pin-texto">
        <p className="pin-titulo">Look {String(n).padStart(2, "0")} <span>· {o.genero}</span></p>
        <ul>
          {o.prendas.map((p) => (
            <li key={p.id}>
              <Link href={`/producto/${p.id}`}>
                <span>{p.name}</span>
                <span>Bs {money(p.precio_venta_bs)} ›</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
