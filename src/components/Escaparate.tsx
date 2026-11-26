"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Anuncio, ProductoPublico } from "@/lib/types";
import { filtrar, nombreCategoria, SECCIONES, seccionesDe, slugCategoria, type Vista } from "@/lib/catalogo";
import { money } from "@/lib/calc";
import { etiquetaTalla } from "@/lib/vitrina";
import Banners from "./Banner";
import Marco from "./Marco";
import Dialog, { CloseButton } from "./Dialog";
import FichaPublica from "./FichaPublica";

/** Formas variadas para que la grilla quede "desordenada" como Pinterest (fijas por prenda) */
const FORMAS = ["3 / 4", "1 / 1", "9 / 16", "4 / 5", "5 / 4", "2 / 3", "3 / 4", "9 / 13", "1 / 1"];

type Chip = { href: string; texto: string; activo: boolean };

/** Título y accesos rápidos (chips) de cada página */
function encabezado(v: Vista, productos: ProductoPublico[]): { kicker: string; titulo: string; chips: Chip[] } {
  const deptos: Chip[] = [
    { href: "/mujer", texto: "MUJER", activo: false },
    { href: "/hombre", texto: "HOMBRE", activo: false },
    { href: "/todo", texto: "VER TODO", activo: false },
    { href: "/c/zapatillas", texto: "ZAPATILLAS", activo: false },
    { href: "/c/accesorios", texto: "ACCESORIOS", activo: false },
  ];
  switch (v.tipo) {
    case "nuevo":
      return { kicker: "RECIÉN AGREGADOS", titulo: "Lo nuevo", chips: deptos };
    case "todo": {
      const cats = Array.from(new Set(productos.map((p) => p.category)));
      return {
        kicker: "TODA LA TIENDA",
        titulo: "Ver todo",
        chips: cats.map((c) => ({ href: `/c/${slugCategoria(c)}`, texto: c, activo: false })),
      };
    }
    case "categoria":
      return {
        kicker: "CATEGORÍA",
        titulo: nombreCategoria(v.categoria),
        chips: deptos.map((d) => ({ ...d, activo: d.href === `/c/${slugCategoria(v.categoria)}` })),
      };
    case "genero": {
      const nombre = v.genero === "mujer" ? "Mujer" : "Hombre";
      const sec = SECCIONES.find((s) => s.slug === v.seccion);
      return {
        kicker: sec ? nombre.toUpperCase() : "DEPARTAMENTO",
        titulo: sec ? sec.nombre : nombre,
        chips: [
          { href: `/${v.genero}`, texto: "VER TODO", activo: !sec },
          ...seccionesDe(v.genero).map((s) => ({ href: `/${v.genero}/${s.slug}`, texto: s.nombre.toUpperCase(), activo: s.slug === v.seccion })),
        ],
      };
    }
  }
}

export default function Escaparate({
  productos,
  vista,
  numero,
  error,
  anuncios = [],
}: {
  productos: ProductoPublico[];
  vista: Vista;
  numero: string | null;
  error: string | null;
  anuncios?: Anuncio[];
}) {
  const [abierto, setAbierto] = useState<number | null>(null);
  const lista = filtrar(productos, vista);
  const { kicker, titulo, chips } = encabezado(vista, productos);
  const actual = productos.find((p) => p.id === abierto) ?? null;
  // En el celular (sin cursor) el primer toque levanta el nombre; el segundo abre la prenda
  const [elegido, setElegido] = useState<number | null>(null);
  const tocar = (e: React.MouseEvent, id: number) => {
    const sinCursor = window.matchMedia("(hover: none)").matches;
    if (sinCursor && e.detail !== 0 && elegido !== id) {
      setElegido(id);
      return;
    }
    setElegido(null);
    abrir(id);
  };

  // La ficha abierta queda en la dirección (?p=7): el botón "atrás" del celular la cierra
  useEffect(() => {
    const leer = () => {
      const id = Number(new URLSearchParams(window.location.search).get("p"));
      setAbierto(Number.isInteger(id) && id > 0 ? id : null);
    };
    leer();
    window.addEventListener("popstate", leer);
    return () => window.removeEventListener("popstate", leer);
  }, []);

  const abrir = (id: number) => {
    window.history.pushState(null, "", `${window.location.pathname}?p=${id}`);
    setAbierto(id);
  };
  const cerrar = useCallback(() => {
    if (new URLSearchParams(window.location.search).get("p")) window.history.back();
    else setAbierto(null);
  }, []);

  return (
    <Marco productos={productos} numero={numero}>
      {vista.tipo === "nuevo" && <Banners anuncios={anuncios} />}
      <section className="shop-title">
        <p className="small muted">
          {kicker} · {lista.length} {lista.length === 1 ? "PRODUCTO" : "PRODUCTOS"}
        </p>
        <h1>{titulo}</h1>
      </section>

      {chips.length > 0 && (
        <nav className="shop-chips" aria-label="Secciones">
          {chips.map((c) => (
            <Link key={c.href} href={c.href} className="chip" aria-current={c.activo ? "page" : undefined}>
              {c.texto}
            </Link>
          ))}
        </nav>
      )}

      {error ? (
        <div className="empty">
          <p className="label">LA TIENDA NO ESTÁ DISPONIBLE EN ESTE MOMENTO</p>
          <p className="muted">Vuelve a intentarlo en unos minutos.</p>
          {process.env.NODE_ENV === "development" && <p className="small error">Solo en tu PC: {error}</p>}
        </div>
      ) : lista.length === 0 ? (
        <div className="empty">
          <h2 style={{ fontSize: 28 }}>Muy pronto</h2>
          <p className="muted">Todavía no hay productos en esta sección.</p>
          <Link href="/todo" className="btn">VER TODA LA TIENDA</Link>
        </div>
      ) : (
        <div className="shop-grid">
          {lista.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`shop-card${elegido === p.id ? " is-elegido" : ""}`}
              style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              onClick={(e) => tocar(e, p.id)}
              onBlur={() => setElegido((x) => (x === p.id ? null : x))}
              aria-label={`${p.name}${p.color ? ", " + p.color : ""}, ${etiquetaTalla(p).toLowerCase()}, Bs ${money(p.precio_venta_bs)}`}
            >
              <span className="shop-img" style={{ aspectRatio: FORMAS[p.id % FORMAS.length] }}>
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" loading={i < 4 ? "eager" : "lazy"} />
                ) : (
                  <span className="placeholder">[ SIN IMAGEN ]</span>
                )}
                <span className="shop-cap" aria-hidden="true">
                  <span className="shop-name">{p.name}</span>
                  <span className="shop-color">{[p.color, etiquetaTalla(p)].filter(Boolean).join(" · ")}</span>
                  <span className="shop-price">Bs {money(p.precio_venta_bs)}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {actual && (
        <Dialog label={actual.name} onClose={cerrar} wide>
          <FichaPublica producto={actual} numero={numero} cerrar={<CloseButton onClick={cerrar} />} />
        </Dialog>
      )}
    </Marco>
  );
}
