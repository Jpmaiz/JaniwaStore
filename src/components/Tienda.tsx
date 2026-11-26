"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProductoPublico } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { money } from "@/lib/calc";
import { enlaceWhatsAppGeneral } from "@/lib/vitrina";
import Marca from "./Marca";
import Dialog, { CloseButton } from "./Dialog";
import FichaPublica from "./FichaPublica";

export default function Tienda({
  productos,
  numero,
  error,
}: {
  productos: ProductoPublico[];
  numero: string | null;
  error: string | null;
}) {
  const [categoria, setCategoria] = useState("TODO");
  const [abierto, setAbierto] = useState<number | null>(null);

  const categorias = useMemo(
    () => ["TODO", ...CATEGORIES.filter((c) => productos.some((p) => p.category === c))],
    [productos],
  );
  const lista = categoria === "TODO" ? productos : productos.filter((p) => p.category === categoria);
  const actual = productos.find((p) => p.id === abierto) ?? null;

  // La ficha abierta queda en la dirección (/?p=7), así el botón "atrás" del celular la cierra
  useEffect(() => {
    const desdeUrl = () => {
      const id = Number(new URLSearchParams(window.location.search).get("p"));
      setAbierto(Number.isInteger(id) && id > 0 ? id : null);
    };
    desdeUrl();
    window.addEventListener("popstate", desdeUrl);
    return () => window.removeEventListener("popstate", desdeUrl);
  }, []);

  const abrir = (id: number) => {
    window.history.pushState(null, "", `/?p=${id}`);
    setAbierto(id);
  };
  const cerrar = useCallback(() => {
    if (new URLSearchParams(window.location.search).get("p")) window.history.back();
    else setAbierto(null);
  }, []);

  return (
    <div className="shop">
      <header className="shop-head">
        <Link href="/" aria-label="Janiwa, inicio" className="shop-brand">
          <Marca subtitulo="PRODUCTOS DE EE. UU." />
        </Link>
        <nav className="shop-nav" aria-label="Principal">
          <a href="#como-comprar">CÓMO COMPRAR</a>
          {numero && (
            <a href={enlaceWhatsAppGeneral(numero)} target="_blank" rel="noreferrer" className="btn btn-outline">
              WHATSAPP ↗
            </a>
          )}
        </nav>
      </header>

      <section className="shop-hero">
        <p className="small muted">COCHABAMBA · BOLIVIA</p>
        <h1>{"Productos de EE.\u00A0UU., por encargo."}</h1>
        <p className="shop-lead">Elige lo que te gusta, escríbenos por WhatsApp y coordinamos el resto.</p>
      </section>

      {categorias.length > 2 && (
        <nav className="shop-cats" aria-label="Categorías">
          {categorias.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={c === categoria} onClick={() => setCategoria(c)}>
              {c}
            </button>
          ))}
        </nav>
      )}

      <main id="productos">
        {error ? (
          <div className="empty">
            <p className="label">LA TIENDA NO ESTÁ DISPONIBLE EN ESTE MOMENTO</p>
            <p className="muted">Vuelve a intentarlo en unos minutos.</p>
          </div>
        ) : lista.length === 0 ? (
          <div className="empty">
            <h2 style={{ fontSize: 30 }}>Muy pronto</h2>
            <p className="muted">Estamos preparando los primeros productos.</p>
          </div>
        ) : (
          <div className="shop-grid">
            {lista.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className="shop-card"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                onClick={() => abrir(p.id)}
                aria-label={`${p.name}${p.color ? ", " + p.color : ""}, Bs ${money(p.precio_venta_bs)}`}
              >
                <span className="shop-img tex">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" loading="lazy" />
                  ) : (
                    <span className="placeholder" style={{ height: 240 }}>
                      [ SIN IMAGEN ]
                    </span>
                  )}
                  <span className={`shop-badge ${p.disponibilidad === "stock" ? "is-stock" : ""}`}>
                    {p.disponibilidad === "stock" ? "EN STOCK" : "POR ENCARGO"}
                  </span>
                </span>
                <span className="shop-info">
                  <span className="shop-name">{p.name}</span>
                  {p.color && <span className="small muted">{p.color.toUpperCase()}</span>}
                  <span className="shop-price">Bs {money(p.precio_venta_bs)}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      <section id="como-comprar" className="shop-how">
        <h2>Cómo comprar</h2>
        <ol>
          <li>
            <span className="how-n">01</span>
            <span className="how-t">Elige</span>
            <span className="muted">Abre el producto y, si corresponde, tu talla.</span>
          </li>
          <li>
            <span className="how-n">02</span>
            <span className="how-t">Escríbenos</span>
            <span className="muted">El botón abre WhatsApp con tu pedido ya escrito.</span>
          </li>
          <li>
            <span className="how-n">03</span>
            <span className="how-t">Coordinamos</span>
            <span className="muted">Acordamos el pago y la entrega directamente contigo.</span>
          </li>
        </ol>
      </section>

      <footer className="shop-foot">
        <span>JANIWA · COCHABAMBA, BOLIVIA</span>
        {numero && (
          <a href={enlaceWhatsAppGeneral(numero)} target="_blank" rel="noreferrer">
            WHATSAPP ↗
          </a>
        )}
      </footer>

      {actual && (
        <Dialog label={actual.name} onClose={cerrar} wide>
          <FichaPublica
            producto={actual}
            numero={numero}
            cerrar={<CloseButton onClick={cerrar} />}
          />
        </Dialog>
      )}
    </div>
  );
}
