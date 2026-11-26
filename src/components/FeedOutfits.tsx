"use client";

import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/calc";
import type { Outfit } from "@/lib/outfits";
import { etiquetaTalla } from "@/lib/vitrina";
import { useBolsa } from "./Bolsa";
import { IconoDerecha } from "./Iconos";

type Filtro = "todos" | "mujer" | "hombre";

/** Feed de outfits sugeridos: collage de fotos y, debajo, el link a cada prenda */
export default function FeedOutfits({ outfits }: { outfits: Outfit[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const lista = filtro === "todos" ? outfits : outfits.filter((o) => o.genero === filtro);

  return (
    <>
      <nav className="shop-chips" aria-label="Filtrar outfits">
        {(["todos", "mujer", "hombre"] as const).map((f) => (
          <button key={f} type="button" className="chip" aria-current={filtro === f ? "page" : undefined} onClick={() => setFiltro(f)}>
            {f === "todos" ? "TODOS" : f.toUpperCase()}
          </button>
        ))}
      </nav>

      {lista.length === 0 ? (
        <div className="empty">
          <h2 style={{ fontSize: 24 }}>Muy pronto</h2>
          <p className="muted">Cuando haya más prendas publicadas, aquí aparecen outfits armados con ellas.</p>
        </div>
      ) : (
        <div className="feed">
          {lista.map((o, n) => (
            <Post key={o.id} o={o} n={outfits.indexOf(o) + 1} prioridad={n < 2} />
          ))}
        </div>
      )}
    </>
  );
}

function Post({ o, n, prioridad }: { o: Outfit; n: number; prioridad: boolean }) {
  const bolsa = useBolsa();
  const faltan = o.prendas.filter((p) => !bolsa.tiene(p.id));
  const [principal, ...resto] = o.prendas;

  return (
    <article className="post" aria-labelledby={`outfit-${o.id}`}>
      <header className="post-cabeza">
        <h2 id={`outfit-${o.id}`}>Outfit {String(n).padStart(2, "0")}</h2>
        <span className="small">{o.genero.toUpperCase()} · {o.prendas.length} PRENDAS</span>
      </header>

      <div className={`collage collage-${Math.min(resto.length, 3)}`}>
        <Link href={`/producto/${principal.id}`} className="collage-main tex" aria-label={principal.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {principal.image_url && <img src={principal.image_url} alt="" loading={prioridad ? "eager" : "lazy"} />}
        </Link>
        {resto.slice(0, 3).map((p) => (
          <Link key={p.id} href={`/producto/${p.id}`} className="collage-item tex" aria-label={p.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.image_url && <img src={p.image_url} alt="" loading="lazy" />}
          </Link>
        ))}
      </div>

      <p className="post-titulo small">EN ESTE OUTFIT</p>
      <ul className="post-prendas">
        {o.prendas.map((p) => (
          <li key={p.id}>
            <Link href={`/producto/${p.id}`}>
              <span className="post-mini tex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image_url && <img src={p.image_url} alt="" loading="lazy" />}
              </span>
              <span className="post-dato">
                <span className="post-nombre">{p.name}</span>
                <span className="small muted">{[p.color, etiquetaTalla(p)].filter(Boolean).join(" · ").toUpperCase()}</span>
              </span>
              <span className="post-precio">Bs {money(p.precio_venta_bs)}</span>
              <IconoDerecha />
            </Link>
          </li>
        ))}
      </ul>

      <div className="post-pie">
        <span className="post-total">Total <b>Bs {money(o.total)}</b></span>
        {faltan.length === 0 ? (
          <button type="button" className="btn" onClick={bolsa.abrir}>EN TU BOLSA ✓</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => bolsa.agregar(faltan)}>
            {faltan.length === o.prendas.length ? "AGREGAR EL OUTFIT A LA BOLSA" : `AGREGAR LAS ${faltan.length} QUE FALTAN`}
          </button>
        )}
      </div>
    </article>
  );
}
