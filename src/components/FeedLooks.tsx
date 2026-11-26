"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { money } from "@/lib/calc";
import type { Outfit } from "@/lib/outfits";
import { etiquetaTalla } from "@/lib/vitrina";
import { useBolsa } from "./Bolsa";
import { IconoCerrar, IconoDerecha } from "./Iconos";

type Filtro = "todos" | "mujer" | "hombre";
/** Formas variadas (fijas por look) para que la grilla quede desordenada como Pinterest */
const FORMAS = ["2 / 3", "1 / 1", "3 / 4", "9 / 16", "4 / 5", "3 / 5", "5 / 6", "2 / 3", "1 / 1.3"];
const sinMovimiento = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Looks: solo fotos en grilla tipo Pinterest; al tocar una, hace pop y muestra las prendas */
export default function FeedLooks({ looks }: { looks: Outfit[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [abierto, setAbierto] = useState<{ look: Outfit; desde: DOMRect } | null>(null);
  const lista = filtro === "todos" ? looks : looks.filter((o) => o.genero === filtro);

  // el botón "atrás" del celular cierra el look
  useEffect(() => {
    const atras = () => setAbierto(null);
    window.addEventListener("popstate", atras);
    return () => window.removeEventListener("popstate", atras);
  }, []);
  const abrir = (look: Outfit, el: HTMLElement) => {
    window.history.pushState({ look: look.id }, "");
    setAbierto({ look, desde: el.getBoundingClientRect() });
  };
  const cerrar = useCallback(() => {
    if (window.history.state?.look) window.history.back();
    else setAbierto(null);
  }, []);

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
          {lista.map((o) => {
            const n = looks.indexOf(o);
            const foto = o.prendas[0].image_url;
            return (
              <button
                key={o.id}
                type="button"
                className={`pin${abierto?.look.id === o.id ? " is-origen" : ""}`}
                style={{ aspectRatio: FORMAS[n % FORMAS.length], animationDelay: `${Math.min(n, 14) * 35}ms` }}
                onClick={(e) => abrir(o, e.currentTarget)}
                aria-label={`Ver look ${n + 1}: ${o.prendas.length} prendas`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {foto && <img src={foto} alt="" loading={n < 6 ? "eager" : "lazy"} />}
              </button>
            );
          })}
        </div>
      )}

      {abierto && <LookAbierto key={abierto.look.id} look={abierto.look} n={looks.indexOf(abierto.look) + 1} desde={abierto.desde} cerrar={cerrar} />}
    </>
  );
}

function LookAbierto({ look, n, desde, cerrar }: { look: Outfit; n: number; desde: DOMRect; cerrar: () => void }) {
  const bolsa = useBolsa();
  const tarjeta = useRef<HTMLDivElement>(null);
  const [fase, setFase] = useState<"pop" | "listo">("pop");
  const faltan = look.prendas.filter((p) => !bolsa.tiene(p.id));
  const [principal, ...resto] = look.prendas;

  // POP: la tarjeta nace en el lugar de la foto tocada y salta al centro
  useLayoutEffect(() => {
    const el = tarjeta.current;
    if (!el) return;
    if (sinMovimiento()) {
      setFase("listo");
      return;
    }
    const fin = el.getBoundingClientRect();
    const dx = desde.left + desde.width / 2 - (fin.left + fin.width / 2);
    const dy = desde.top + desde.height / 2 - (fin.top + fin.height / 2);
    const s = Math.max(0.15, Math.min(desde.width / fin.width, desde.height / fin.height));
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
    el.style.opacity = "0.6";
    void el.offsetWidth; // aplicar el punto de partida antes de animar
    el.style.transition = "transform .55s cubic-bezier(.2,1.25,.35,1), opacity .25s ease";
    el.style.transform = "none";
    el.style.opacity = "1";
    const t = setTimeout(() => setFase("listo"), 380);
    return () => clearTimeout(t);
  }, [desde]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    tarjeta.current?.focus();
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  }, [cerrar]);

  return (
    <div className={`look-root fase-${fase}`} role="dialog" aria-modal="true" aria-label={`Look ${n}`}>
      <button type="button" className="look-scrim" aria-label="Cerrar" tabIndex={-1} onClick={cerrar} />
      <div ref={tarjeta} className="look" tabIndex={-1}>
        <div className={`look-fotos look-fotos-${Math.min(resto.length, 3)}`}>
          <Link href={`/producto/${principal.id}`} className="look-main tex" aria-label={principal.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {principal.image_url && <img src={principal.image_url} alt="" />}
          </Link>
          {resto.slice(0, 3).map((p) => (
            <Link key={p.id} href={`/producto/${p.id}`} className="look-mini tex" aria-label={p.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image_url && <img src={p.image_url} alt="" />}
            </Link>
          ))}
        </div>

        <div className="look-info">
          <div className="look-cabeza">
            <div>
              <h2>Look {String(n).padStart(2, "0")}</h2>
              <p className="small">{look.genero.toUpperCase()} · DISPONIBLE AHORA</p>
            </div>
            <button type="button" className="icon-btn" onClick={cerrar} aria-label="Cerrar look">
              <IconoCerrar />
            </button>
          </div>

          <ul className="look-prendas">
            {look.prendas.map((p, i) => (
              <li key={p.id} style={{ "--i": i } as React.CSSProperties}>
                <Link href={`/producto/${p.id}`} className="look-prenda">
                  <span className="look-thumb tex">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.image_url && <img src={p.image_url} alt="" />}
                  </span>
                  <span className="look-dato">
                    <span className="look-nombre">{p.name}</span>
                    <span className="small muted">{[p.color, etiquetaTalla(p)].filter(Boolean).join(" · ").toUpperCase()}</span>
                    <span className="look-precio">Bs {money(p.precio_venta_bs)}</span>
                  </span>
                  <IconoDerecha />
                </Link>
                <button
                  type="button"
                  className="look-sumar"
                  onClick={() => (bolsa.tiene(p.id) ? bolsa.abrir() : bolsa.agregar(p))}
                  aria-label={bolsa.tiene(p.id) ? `${p.name} ya está en tu bolsa` : `Agregar ${p.name} a la bolsa`}
                >
                  {bolsa.tiene(p.id) ? "✓" : "+"}
                </button>
              </li>
            ))}
          </ul>

          <div className="look-pie" style={{ "--i": look.prendas.length } as React.CSSProperties}>
            <span className="post-total">Total <b>Bs {money(look.total)}</b></span>
            {faltan.length === 0 ? (
              <button type="button" className="btn" onClick={bolsa.abrir}>EN TU BOLSA ✓ · VER BOLSA</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => bolsa.agregar(faltan)}>
                {faltan.length === look.prendas.length ? "AGREGAR EL LOOK A LA BOLSA" : `AGREGAR LAS ${faltan.length} QUE FALTAN`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
