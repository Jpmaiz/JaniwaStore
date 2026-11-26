"use client";

import { useState, useTransition } from "react";
import { eliminarTienda, guardarTienda, type CambiosTienda } from "@/app/actions";
import type { Store } from "@/lib/types";
import { money, precio } from "@/lib/calc";
import type { Moneda } from "@/lib/types";
import Row from "./Row";
import { useConfirm } from "./Confirm";

export type Visto = { nombre: string; totalBs: number | null; esMejor: boolean; agotado: boolean };

export type Estadisticas = {
  ofertas: number;
  vecesMejor: number;
  envio: number | null;
  moneda: Moneda | null;
  sugerenciaUrl: string | null;
  vistos: Visto[];
};

function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function StoreCard({ store, stats }: { store: Store; stats: Estadisticas }) {
  const [intereses, setIntereses] = useState(store.intereses);
  const [nuevo, setNuevo] = useState("");
  const [notas, setNotas] = useState(store.notes ?? "");
  const [url, setUrl] = useState(store.url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();
  const confirmar = useConfirm();

  const guardar = (cambios: CambiosTienda) =>
    startTransition(async () => {
      const r = await guardarTienda(store.name, cambios);
      setError(r.ok ? null : r.error);
    });

  const agregarInteres = () => {
    const v = nuevo.trim();
    if (!v || intereses.includes(v)) return setNuevo("");
    const lista = [...intereses, v];
    setIntereses(lista);
    setNuevo("");
    guardar({ intereses: lista });
  };

  const quitarInteres = (i: string) => {
    const lista = intereses.filter((x) => x !== i);
    setIntereses(lista);
    guardar({ intereses: lista });
  };

  const borrar = async () => {
    if (!store.id) return;
    const ok = await confirmar({
      titulo: "¿Quitar ficha?",
      mensaje: `Ficha de ${store.name}`,
      detalle: "Tus intereses y notas de esta tienda se borran. Tus ofertas no.",
      confirmar: "QUITAR",
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await eliminarTienda(store.id!);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <article className="store">
      <header className="store-head">
        {store.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="store-icon"
            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(dominio(store.url))}&sz=64`}
            alt=""
          />
        )}
        <h3>{store.name}</h3>
        <button
          type="button"
          className={`star ${store.favorita ? "on" : ""}`}
          aria-pressed={store.favorita}
          aria-label={store.favorita ? "Quitar de favoritas" : "Marcar como favorita"}
          onClick={() => guardar({ favorita: !store.favorita })}
          disabled={pendiente}
        >
          {store.favorita ? "★" : "☆"}
        </button>
      </header>

      {store.url ? (
        <a className="small" href={store.url} target="_blank" rel="noreferrer">
          {dominio(store.url).toUpperCase()} ↗
        </a>
      ) : (
        <div className="field">
          <span>LINK DE LA TIENDA</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="url"
              value={url}
              placeholder={stats.sugerenciaUrl ?? "https://"}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && guardar({ url: url || stats.sugerenciaUrl })}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button type="button" className="btn" onClick={() => guardar({ url: url || stats.sugerenciaUrl })} disabled={pendiente || !(url || stats.sugerenciaUrl)}>
              GUARDAR
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
        <Row label="OFERTAS GUARDADAS" value={String(stats.ofertas).padStart(2, "0")} />
        <Row label="LA MÁS BARATA EN" value={`${stats.vecesMejor} ${stats.vecesMejor === 1 ? "PRODUCTO" : "PRODUCTOS"}`} />
        <Row
          label={stats.moneda === "BOB" ? "ENVÍO LOCAL" : "ENVÍO"}
          value={stats.envio != null ? precio(stats.moneda, stats.envio) : "—"}
        />
        {stats.moneda && stats.moneda !== "USD" && (
          <Row label="MONEDA" value={stats.moneda === "BOB" ? "BOLIVIANOS" : "EUROS"} />
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="label">ME INTERESA</span>
        {intereses.length > 0 && (
          <ul className="tags">
            {intereses.map((i) => (
              <li key={i} className="tag">
                {i}
                <button type="button" aria-label={`Quitar ${i}`} onClick={() => quitarInteres(i)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          className="tag-input"
          type="text"
          value={nuevo}
          placeholder="Ej. rebajas de enero · Enter para agregar"
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarInteres();
            }
          }}
          aria-label={`Agregar algo que te interesa de ${store.name}`}
        />
      </div>

      <label className="field">
        <span>NOTAS</span>
        <textarea
          rows={2}
          value={notas}
          placeholder="Tallas, cupones, cuándo hacen sale…"
          onChange={(e) => setNotas(e.target.value)}
          onBlur={() => notas !== (store.notes ?? "") && guardar({ notes: notas })}
        />
      </label>

      {stats.vistos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="label">VISTO AQUÍ</span>
          {stats.vistos.slice(0, 5).map((v) => (
            <Row
              key={v.nombre}
              className={v.agotado ? "muted" : undefined}
              label={`${v.esMejor ? "★ " : ""}${v.nombre}`}
              value={v.agotado ? "AGOTADO" : v.totalBs != null ? `Bs ${money(v.totalBs)}` : "—"}
            />
          ))}
          {stats.vistos.length > 5 && <span className="small muted">+ {stats.vistos.length - 5} MÁS</span>}
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {store.id && (
        <button type="button" className="small muted store-remove" onClick={borrar} disabled={pendiente}>
          QUITAR FICHA
        </button>
      )}
    </article>
  );
}
