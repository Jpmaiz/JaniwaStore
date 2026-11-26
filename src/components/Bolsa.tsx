"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { registrarInteres } from "@/app/public-actions";
import { codigo, money } from "@/lib/calc";
import type { ProductoPublico } from "@/lib/types";
import { enlaceWhatsAppBolsa, type ItemBolsa } from "@/lib/vitrina";
import { IconoBolsa, IconoCerrar } from "./Iconos";

const CLAVE = "janiwa-bolsa";

type Ctx = {
  items: ItemBolsa[];
  tiene: (id: number) => boolean;
  agregar: (p: ProductoPublico | ProductoPublico[]) => void;
  quitar: (id: number) => void;
  abrir: () => void;
  latido: number; // cambia cada vez que se agrega algo (para animar el ícono)
};

const Contexto = createContext<Ctx>({
  items: [],
  tiene: () => false,
  agregar: () => {},
  quitar: () => {},
  abrir: () => {},
  latido: 0,
});

export const useBolsa = () => useContext(Contexto);

const aItem = (p: ProductoPublico): ItemBolsa => ({
  id: p.id,
  name: p.name,
  color: p.color,
  tallas: p.tallas,
  precio: p.precio_venta_bs,
  foto: p.image_url,
});

/** Bolsa de compras: vive en el layout raíz, se guarda en este navegador y se pide por WhatsApp */
export function BolsaProvider({ numero, children }: { numero: string | null; children: React.ReactNode }) {
  const [items, setItems] = useState<ItemBolsa[]>([]);
  const [abierta, setAbierta] = useState(false);
  const [latido, setLatido] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const cargada = useRef(false);
  const ruta = usePathname();
  const privada = ruta.startsWith("/admin") || ruta.startsWith("/login");

  // leer y guardar en el navegador (si el navegador no deja, la bolsa vive solo en esta visita)
  useEffect(() => {
    try {
      const guardada = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
      if (Array.isArray(guardada)) setItems(guardada.filter((x) => x && typeof x.id === "number").slice(0, 30));
    } catch {}
    cargada.current = true;
  }, []);
  useEffect(() => {
    if (!cargada.current) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {}
  }, [items]);

  const agregar = useCallback((p: ProductoPublico | ProductoPublico[]) => {
    const nuevos = (Array.isArray(p) ? p : [p]).map(aItem);
    setItems((xs) => [...xs, ...nuevos.filter((n) => !xs.some((x) => x.id === n.id))]);
    setLatido((n) => n + 1);
    setAviso(nuevos.length === 1 ? "Agregado a tu bolsa" : `${nuevos.length} prendas agregadas a tu bolsa`);
  }, []);
  const quitar = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const tiene = useCallback((id: number) => items.some((x) => x.id === id), [items]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2200);
    return () => clearTimeout(t);
  }, [aviso, latido]);

  const valor = useMemo(() => ({ items, tiene, agregar, quitar, abrir: () => setAbierta(true), latido }), [items, tiene, agregar, quitar, latido]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      {!privada && (
        <>
          <PanelBolsa abierta={abierta} cerrar={() => setAbierta(false)} items={items} quitar={quitar} numero={numero} />
          <div className={`bolsa-aviso${aviso ? " is-visible" : ""}`} role="status" aria-live="polite">
            {aviso && (
              <>
                <span>{aviso}</span>
                <button type="button" onClick={() => setAbierta(true)}>VER BOLSA</button>
              </>
            )}
          </div>
        </>
      )}
    </Contexto.Provider>
  );
}

function PanelBolsa({
  abierta,
  cerrar,
  items,
  quitar,
  numero,
}: {
  abierta: boolean;
  cerrar: () => void;
  items: ItemBolsa[];
  quitar: (id: number) => void;
  numero: string | null;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const total = items.reduce((s, p) => s + p.precio, 0);

  useEffect(() => {
    if (!abierta) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  }, [abierta, cerrar]);

  const pedir = () => {
    for (const p of items) void registrarInteres(p.id);
  };

  return (
    <div className={`bolsa-root${abierta ? " is-abierta" : ""}`} inert={!abierta}>
      <button type="button" className="bolsa-scrim" aria-label="Cerrar bolsa" tabIndex={-1} onClick={cerrar} />
      <div ref={panel} className="bolsa" role="dialog" aria-modal="true" aria-label="Tu bolsa" tabIndex={-1}>
        <div className="bolsa-top">
          <h2>Tu bolsa</h2>
          <span className="small">{String(items.length).padStart(2, "0")} {items.length === 1 ? "PRENDA" : "PRENDAS"}</span>
          <button type="button" className="icon-btn" onClick={cerrar} aria-label="Cerrar bolsa">
            <IconoCerrar />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bolsa-vacia">
            <p>Tu bolsa está vacía.</p>
            <p className="small muted">Cada prenda es única: agrégala antes de que otro la pida.</p>
            <Link href="/" className="btn" onClick={cerrar}>VER LO NUEVO</Link>
          </div>
        ) : (
          <>
            <ul className="bolsa-lista">
              {items.map((p) => (
                <li key={p.id}>
                  <Link href={`/producto/${p.id}`} onClick={cerrar} className="bolsa-foto tex">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.foto && <img src={p.foto} alt="" />}
                  </Link>
                  <div className="bolsa-datos">
                    <Link href={`/producto/${p.id}`} onClick={cerrar} className="bolsa-nombre">{p.name}</Link>
                    <span className="small muted">
                      {[codigo(p.id), p.color, p.tallas.length ? `TALLA ${p.tallas.join("/")}` : null].filter(Boolean).join(" · ").toUpperCase()}
                    </span>
                    <span className="bolsa-precio">Bs {money(p.precio)}</span>
                  </div>
                  <button type="button" className="bolsa-quitar" onClick={() => quitar(p.id)} aria-label={`Quitar ${p.name} de la bolsa`}>
                    <IconoCerrar />
                  </button>
                </li>
              ))}
            </ul>
            <div className="bolsa-pie">
              <div className="bolsa-total">
                <span className="label">TOTAL</span>
                <span className="bolsa-total-num">Bs {money(total)}</span>
              </div>
              {numero ? (
                <a
                  className="btn btn-primary"
                  href={enlaceWhatsAppBolsa(numero, items, typeof window === "undefined" ? "" : window.location.origin)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={pedir}
                >
                  PEDIR POR WHATSAPP ↗
                </a>
              ) : (
                <button type="button" className="btn btn-primary" disabled>WHATSAPP NO CONFIGURADO</button>
              )}
              <p className="small muted">Te llega a nuestro WhatsApp la lista con todas tus prendas. El pago y la entrega se coordinan ahí.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Botón de la barra con el número de prendas */
export function BotonBolsa() {
  const { items, abrir, latido } = useBolsa();
  return (
    <button type="button" className="bar-btn bar-bolsa" onClick={abrir} aria-label={`Abrir bolsa, ${items.length} prendas`}>
      <span key={latido} className={latido ? "bolsa-latido" : undefined}>
        <IconoBolsa />
      </span>
      {items.length > 0 && <span className="bolsa-num">{items.length}</span>}
    </button>
  );
}
