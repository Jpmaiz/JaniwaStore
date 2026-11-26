"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductoPublico } from "@/lib/types";
import { CATEGORIAS_MENU, nombreCategoria, seccionesDe, slugCategoria } from "@/lib/catalogo";
import { enlaceWhatsAppGeneral } from "@/lib/vitrina";
import { IconoCerrar, IconoChat, IconoDerecha, IconoIzquierda, IconoMenu } from "./Iconos";
import LogoEscurridizo from "./LogoEscurridizo";
import ComoComprar from "./ComoComprar";
import { BotonBolsa } from "./Bolsa";

type Nivel = "raiz" | "mujer" | "hombre";
const NOMBRE = { mujer: "Mujer", hombre: "Hombre" } as const;

/** Marco de la tienda: cabecera fija, menú lateral y pie. Envuelve cada página pública. */
export default function Marco({
  productos,
  numero,
  children,
}: {
  productos: ProductoPublico[];
  numero: string | null;
  children: React.ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  const cerrarMenu = useCallback(() => setMenu(false), []);
  const ruta = usePathname();

  // Zapatillas y Accesorios siempre; el resto de categorías solo si tienen productos
  const categorias = CATEGORIAS_MENU.filter(
    (c) => c === "ZAPATILLAS" || c === "ACCESORIOS" || productos.some((p) => p.category === c),
  );
  const activo = (href: string) => (href === "/" ? ruta === "/" : ruta.startsWith(href));

  return (
    <div className="shop-page">
      <header className="shop-bar">
        <div className="bar-inner">
        <button type="button" className="bar-btn bar-menu" onClick={() => setMenu(true)} aria-label="Abrir menú" aria-expanded={menu}>
          <IconoMenu />
        </button>

        <LogoEscurridizo />

        <nav className="bar-nav" aria-label="Departamentos">
          {[
            ["/", "NUEVO"],
            ["/mujer", "MUJER"],
            ["/hombre", "HOMBRE"],
            ["/todo", "VER TODO"],
            ["/outfits", "OUTFITS"],
            ["/c/zapatillas", "ZAPATILLAS"],
            ["/c/accesorios", "ACCESORIOS"],
          ].map(([href, txt]) => (
            <Link key={href} href={href} aria-current={activo(href) ? "page" : undefined}>
              {txt}
            </Link>
          ))}
        </nav>

        <div className="bar-der">
          {numero && (
            <a className="bar-btn bar-wa" href={enlaceWhatsAppGeneral(numero)} target="_blank" rel="noreferrer" aria-label="Escribir por WhatsApp">
              <IconoChat />
              <span>WHATSAPP</span>
            </a>
          )}
          <BotonBolsa />
        </div>
        </div>
      </header>

      <Menu abierto={menu} cerrar={cerrarMenu} categorias={categorias} numero={numero} />

      <div className="shop">
      <div className="shop-main">{children}</div>

      <footer className="shop-foot">
        <ComoComprar numero={numero} />
        <p className="foot-legal">JANIWA · COCHABAMBA, BOLIVIA</p>
      </footer>
      </div>
    </div>
  );
}

/** Menú lateral de 2 niveles (como las apps de tiendas de ropa) */
function Menu({
  abierto,
  cerrar,
  categorias,
  numero,
}: {
  abierto: boolean;
  cerrar: () => void;
  categorias: string[];
  numero: string | null;
}) {
  const [nivel, setNivel] = useState<Nivel>("raiz");
  const [genero, setGenero] = useState<"mujer" | "hombre">("mujer");
  const raiz = useRef<HTMLDivElement>(null);
  const sub = useRef<HTMLDivElement>(null);

  // al cerrar, vuelve al primer nivel (después de la animación)
  useEffect(() => {
    if (abierto) return;
    const t = setTimeout(() => setNivel("raiz"), 320);
    return () => clearTimeout(t);
  }, [abierto]);

  // Esc cierra (o vuelve atrás) y la página de fondo no se desplaza
  useEffect(() => {
    if (!abierto) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (nivel !== "raiz") setNivel("raiz");
      else cerrar();
    };
    window.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [abierto, nivel, cerrar]);

  // foco en el primer elemento del nivel visible
  useEffect(() => {
    if (!abierto) return;
    const panel = nivel === "raiz" ? raiz.current : sub.current;
    const t = setTimeout(() => panel?.querySelector<HTMLElement>("a, button")?.focus(), 60);
    return () => clearTimeout(t);
  }, [abierto, nivel]);

  const abrirGenero = (g: "mujer" | "hombre") => {
    setGenero(g);
    setNivel(g);
  };

  return (
    <div className={`menu-root ${abierto ? "is-open" : ""}`} inert={!abierto}>
      <button type="button" className="menu-scrim" onClick={cerrar} tabIndex={-1} aria-label="Cerrar menú" />
      <div className="menu" role="dialog" aria-modal="true" aria-label="Menú de la tienda">
        <div className={`menu-track ${nivel !== "raiz" ? "is-sub" : ""}`}>
          {/* Nivel 1 */}
          <div className="menu-panel" ref={raiz} inert={nivel !== "raiz"}>
            <div className="menu-top">
              <span className="menu-title">Menú</span>
              <button type="button" className="bar-btn" onClick={cerrar} aria-label="Cerrar menú">
                <IconoCerrar />
              </button>
            </div>
            <ul className="menu-list">
              <li><Link href="/" onClick={cerrar} className="menu-item">Lo nuevo</Link></li>
              <li>
                <button type="button" className="menu-item" onClick={() => abrirGenero("mujer")}>
                  Mujer <IconoDerecha />
                </button>
              </li>
              <li>
                <button type="button" className="menu-item" onClick={() => abrirGenero("hombre")}>
                  Hombre <IconoDerecha />
                </button>
              </li>
              <li><Link href="/todo" onClick={cerrar} className="menu-item">Ver todo</Link></li>
              <li><Link href="/outfits" onClick={cerrar} className="menu-item">Outfits</Link></li>
              {categorias.map((c) => (
                <li key={c}>
                  <Link href={`/c/${slugCategoria(c)}`} onClick={cerrar} className="menu-item">
                    {nombreCategoria(c)}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="menu-extra">
              <span className="label">PIEZAS ÚNICAS</span>
              <span className="small muted">Cada prenda es una sola, en una sola talla. Cuando se vende, no vuelve.</span>
            </div>

            {numero && (
              <a className="menu-wa" href={enlaceWhatsAppGeneral(numero)} target="_blank" rel="noreferrer">
                <IconoChat /> ESCRÍBENOS POR WHATSAPP
              </a>
            )}
          </div>

          {/* Nivel 2: Mujer / Hombre */}
          <div className="menu-panel" ref={sub} inert={nivel === "raiz"}>
            <div className="menu-top">
              <button type="button" className="bar-btn" onClick={() => setNivel("raiz")} aria-label="Volver al menú">
                <IconoIzquierda />
              </button>
              <span className="menu-title">{NOMBRE[genero]}</span>
              <button type="button" className="bar-btn" onClick={cerrar} aria-label="Cerrar menú">
                <IconoCerrar />
              </button>
            </div>
            <ul className="menu-list">
              <li>
                <Link href={`/${genero}`} onClick={cerrar} className="menu-item menu-item-strong">
                  Ver todo {NOMBRE[genero].toLowerCase()}
                </Link>
              </li>
              {seccionesDe(genero).map((s) => (
                <li key={s.slug}>
                  <Link href={`/${genero}/${s.slug}`} onClick={cerrar} className="menu-item">
                    {s.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
