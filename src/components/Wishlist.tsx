"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dolar, Product, Settings } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { money, resumir } from "@/lib/calc";
import { DURACION, type Efecto } from "@/lib/arcade";
import { eliminarProducto } from "@/app/actions";
import Sidebar from "./Sidebar";
import Tile from "./Tile";
import Row from "./Row";
import ProductSheet from "./ProductSheet";
import Dialog from "./Dialog";
import AddProductForm from "./AddProductForm";
import SettingsForm from "./SettingsForm";

type Modal = null | "agregar" | "ajustes";

export default function Wishlist({
  products,
  settings,
  dolar,
  error,
}: {
  products: Product[];
  settings: Settings;
  dolar: Dolar;
  error: string | null;
}) {
  const [categoria, setCategoria] = useState("TODO");
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [efectos, setEfectos] = useState<Record<number, Efecto>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  const sinMovimiento = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const quitarEfecto = useCallback((id: number) => {
    setEfectos((e) => {
      const n = { ...e };
      delete n[id];
      return n;
    });
  }, []);

  /** Pone un efecto en una tarjeta y lo quita cuando termina */
  const lanzarEfecto = useCallback(
    (id: number, tipo: Efecto) => {
      clearTimeout(timers.current[id]);
      setEfectos((e) => ({ ...e, [id]: tipo }));
      timers.current[id] = setTimeout(() => quitarEfecto(id), sinMovimiento() ? 0 : DURACION[tipo] + 150);
    },
    [quitarEfecto],
  );

  const verTarjeta = (id: number) =>
    document.getElementById(`tile-${id}`)?.scrollIntoView({ behavior: sinMovimiento() ? "auto" : "smooth", block: "center" });
  const [modal, setModal] = useState<Modal>(null);

  const paralelo = settings.paralelo_manual ?? dolar.paralelo;
  const esManual = settings.paralelo_manual != null;
  const euroUsd = settings.eur_usd_manual ?? dolar.euroUsd;

  const lista = useMemo(
    () => (categoria === "TODO" ? products : products.filter((p) => p.category === categoria)),
    [products, categoria],
  );

  const conteo = useMemo(() => {
    const c: Record<string, number> = { TODO: products.length };
    for (const cat of CATEGORIES) c[cat] = products.filter((p) => p.category === cat).length;
    return c;
  }, [products]);

  const resumenes = useMemo(
    () => new Map(lista.map((p) => [p.id, resumir(p, settings, paralelo, euroUsd)])),
    [lista, settings, paralelo, euroUsd],
  );

  // Total de la wishlist visible: siempre con la oferta más barata que tenga stock
  const totalBs = useMemo(() => {
    if (!paralelo) return null;
    return lista.reduce((s, p) => s + (resumenes.get(p.id)?.mejor?.costo?.totalBs ?? 0), 0);
  }, [lista, resumenes, paralelo]);

  const idx = lista.findIndex((p) => p.id === seleccion);
  const actual = idx >= 0 ? lista[idx] : null;
  const mover = (paso: number) => {
    if (idx < 0 || !lista.length) return;
    setSeleccion(lista[(idx + paso + lista.length) % lista.length].id);
  };

  const cerrarModal = useCallback(() => setModal(null), []);
  // Se cierra la vista previa y la tarjeta aparece en la grilla con la animación
  const alAgregar = useCallback(
    (res?: { id: number; nueva: boolean }) => {
      setModal(null);
      if (!res) return;
      setCategoria("TODO");
      lanzarEfecto(res.id, res.nueva ? "entrar" : "mas1");
      setTimeout(() => verTarjeta(res.id), 60);
    },
    [lanzarEfecto],
  );

  // Se cierra la ficha, la tarjeta explota en la grilla y recién después se borra
  const alEliminar = useCallback(
    async (id: number) => {
      setSeleccion(null);
      setAviso(null);
      verTarjeta(id);
      const rapido = sinMovimiento();
      await new Promise((ok) => setTimeout(ok, rapido ? 0 : 280));
      clearTimeout(timers.current[id]);
      setEfectos((e) => ({ ...e, [id]: "explotar" }));
      await new Promise((ok) => setTimeout(ok, rapido ? 0 : DURACION.explotar));
      const r = await eliminarProducto(id);
      quitarEfecto(id);
      if (!r.ok) setAviso(`No se pudo eliminar: ${r.error}`);
    },
    [quitarEfecto],
  );
  const cerrarFicha = useCallback(() => setSeleccion(null), []);

  return (
    <div className="shell">
      <Sidebar
        activo="WISHLIST"
        categoria={categoria}
        conteo={conteo}
        onCategoria={(c) => {
          setCategoria(c);
          setSeleccion(null);
        }}
      />

      <main className="content">
        <header className="header">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="small muted">TX-100-01 · BOLIVIA</p>
            <h2>Wishlist</h2>
            <p className="muted" style={{ fontSize: 12 }}>
              {String(lista.length).padStart(2, "0")} ARTÍCULOS · {categoria}
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 24 }}>
            <div className="ticker">
              <Row
                label={esManual ? "USD PARALELO (MANUAL)" : "USD PARALELO"}
                value={paralelo ? `Bs ${money(paralelo)}` : "SIN DATO"}
              />
              <Row className="muted" label="USD OFICIAL" value={dolar.oficial ? `Bs ${money(dolar.oficial)}` : "—"} />
              <Row
                className="muted"
                label={settings.eur_usd_manual != null ? "1 EURO (MANUAL)" : "1 EURO"}
                value={euroUsd ? `$ ${euroUsd.toLocaleString("es-BO", { maximumFractionDigits: 4 })}` : "SIN DATO"}
              />
              <Row label="COLCHÓN · TAX" value={`${settings.colchon_pct} % · ${settings.tax_pct} %`} />
              <Row label="WISHLIST EN BS" value={<strong>{totalBs != null ? `Bs ${money(totalBs)}` : "—"}</strong>} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={() => setModal("ajustes")}>AJUSTES</button>
              <button className="btn btn-outline" onClick={() => setModal("agregar")}>+ AGREGAR</button>
            </div>
          </div>
        </header>

        {aviso && <p className="error">{aviso}</p>}

        {error ? (
          <div className="empty">
            <p className="label">NO SE PUDO CONECTAR A LA BASE DE DATOS</p>
            <p className="muted">{error}</p>
            <p className="muted">Revisa tu archivo .env.local y que hayas corrido supabase/schema.sql.</p>
          </div>
        ) : lista.length === 0 ? (
          <div className="empty">
            <h3 style={{ fontSize: 32 }}>Nada por aquí todavía</h3>
            <p className="muted">Agrega el primer producto que te interesa traer.</p>
            <button className="btn btn-primary" onClick={() => setModal("agregar")}>+ AGREGAR PRODUCTO</button>
          </div>
        ) : (
          <div className="masonry">
            {lista.map((p) => (
              <Tile
                key={p.id}
                product={p}
                resumen={resumenes.get(p.id)!}
                efecto={efectos[p.id]}
                onOpen={() => setSeleccion(p.id)}
              />
            ))}
          </div>
        )}
      </main>

      {actual && (
        <ProductSheet
          product={actual}
          settings={settings}
          paralelo={paralelo}
          euroUsd={euroUsd}
          onClose={cerrarFicha}
          onEliminar={alEliminar}
          onPrev={() => mover(-1)}
          onNext={() => mover(1)}
        />
      )}

      {modal === "agregar" && (
        <Dialog label="Agregar producto" onClose={cerrarModal}>
          <AddProductForm products={products} onDone={alAgregar} />
        </Dialog>
      )}
      {modal === "ajustes" && (
        <Dialog label="Ajustes de cálculo" onClose={cerrarModal}>
          <SettingsForm settings={settings} paraleloAuto={dolar.paralelo} euroAuto={dolar.euroUsd} onDone={cerrarModal} />
        </Dialog>
      )}
    </div>
  );
}
