"use client";

import { useMemo, useState, useTransition } from "react";
import { guardarTienda } from "@/app/actions";
import type { Product, Settings, Store } from "@/lib/types";
import { resumir } from "@/lib/calc";
import { detectarTienda } from "@/lib/tiendas";
import Sidebar from "./Sidebar";
import StoreCard, { type Estadisticas } from "./StoreCard";

export default function Stores({
  stores,
  products,
  settings,
  paralelo,
  euroUsd,
  error,
}: {
  stores: Store[];
  products: Product[];
  settings: Settings;
  paralelo: number | null;
  euroUsd: number | null;
  error: string | null;
}) {
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [nueva, setNueva] = useState("");
  const [errorNueva, setErrorNueva] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  // Números de cada tienda a partir de tus ofertas
  const stats = useMemo(() => {
    const mapa = new Map<string, Estadisticas>();
    const de = (nombre: string) => {
      if (!mapa.has(nombre)) mapa.set(nombre, { ofertas: 0, vecesMejor: 0, envio: null, moneda: null, sugerenciaUrl: null, vistos: [] });
      return mapa.get(nombre)!;
    };
    for (const p of products) {
      const r = resumir(p, settings, paralelo, euroUsd);
      for (const { offer, costo } of r.ordenadas) {
        const st = de(offer.store);
        const esMejor = r.mejor?.offer.id === offer.id;
        st.ofertas++;
        if (esMejor) st.vecesMejor++;
        st.envio ??= offer.shipping_usd;
        st.moneda ??= offer.currency;
        if (!st.sugerenciaUrl && offer.url) {
          try {
            st.sugerenciaUrl = new URL(offer.url).origin;
          } catch {}
        }
        st.vistos.push({
          nombre: p.color ? `${p.name} · ${p.color}` : p.name,
          totalBs: costo?.totalBs ?? null,
          esMejor,
          agotado: offer.status === "AGOTADO",
        });
      }
    }
    return mapa;
  }, [products, settings, paralelo, euroUsd]);

  const vacio: Estadisticas = { ofertas: 0, vecesMejor: 0, envio: null, moneda: null, sugerenciaUrl: null, vistos: [] };

  const lista = useMemo(() => {
    const filtradas = soloFavoritas ? stores.filter((s) => s.favorita) : stores;
    return [...filtradas].sort(
      (a, b) =>
        Number(b.favorita) - Number(a.favorita) ||
        (stats.get(b.name)?.ofertas ?? 0) - (stats.get(a.name)?.ofertas ?? 0) ||
        a.name.localeCompare(b.name),
    );
  }, [stores, soloFavoritas, stats]);

  // Agregar tienda: pegas el link (o escribes el nombre)
  const agregar = () => {
    const v = nueva.trim();
    if (!v) return;
    const esLink = /^https?:\/\//i.test(v);
    const detectada = esLink ? detectarTienda(v) : null;
    const nombre = (detectada?.store ?? v).toUpperCase();
    if (stores.some((s) => s.name === nombre && s.id)) {
      setErrorNueva(`${nombre} ya está en tu lista.`);
      return;
    }
    startTransition(async () => {
      const r = await guardarTienda(nombre, esLink ? { url: new URL(v).origin } : {});
      if (r.ok) {
        setNueva("");
        setErrorNueva(null);
      } else setErrorNueva(r.error);
    });
  };

  const favoritas = stores.filter((s) => s.favorita).length;

  return (
    <div className="shell">
      <Sidebar activo="TIENDAS" />

      <main className="content">
        <header className="header">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="small muted">TX-100-02 · DIRECTORIO</p>
            <h2>Tiendas</h2>
            <p className="muted" style={{ fontSize: 12 }}>
              {String(stores.length).padStart(2, "0")} TIENDAS · {String(favoritas).padStart(2, "0")} FAVORITAS
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 280, flex: "0 1 420px" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="tag-input"
                type="text"
                value={nueva}
                placeholder="Pega el link de una tienda o escribe su nombre"
                onChange={(e) => setNueva(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agregar()}
                aria-label="Nueva tienda"
                style={{ flex: 1, minWidth: 0 }}
              />
              <button type="button" className="btn btn-outline" onClick={agregar} disabled={pendiente || !nueva.trim()}>
                + AGREGAR
              </button>
            </div>
            {errorNueva && <p className="error">{errorNueva}</p>}
            <button
              type="button"
              className="small muted"
              style={{ alignSelf: "flex-end", minHeight: 32 }}
              aria-pressed={soloFavoritas}
              onClick={() => setSoloFavoritas((v) => !v)}
            >
              {soloFavoritas ? "★ SOLO FAVORITAS" : "☆ VER SOLO FAVORITAS"}
            </button>
          </div>
        </header>

        {error ? (
          <div className="empty">
            <p className="label">NO SE PUDIERON CARGAR LAS TIENDAS</p>
            <p className="muted">{error}</p>
          </div>
        ) : lista.length === 0 ? (
          <div className="empty">
            <h3 style={{ fontSize: 32 }}>{soloFavoritas ? "Sin favoritas todavía" : "Aún no hay tiendas"}</h3>
            <p className="muted">
              {soloFavoritas
                ? "Marca con ☆ las tiendas que más visitas."
                : "Pega arriba el link de una tienda. Las tiendas de tus ofertas aparecen aquí solas."}
            </p>
          </div>
        ) : (
          <div className="stores">
            {lista.map((s) => (
              <StoreCard key={s.name} store={s} stats={stats.get(s.name) ?? vacio} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
