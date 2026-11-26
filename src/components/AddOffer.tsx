"use client";

import { useState, useTransition } from "react";
import { agregarOferta } from "@/app/actions";
import type { Lectura } from "@/lib/scraper";
import { normalizar } from "@/lib/tiendas";
import type { Moneda, Product } from "@/lib/types";
import LinkReader from "./LinkReader";

/** Agregar otra tienda a una tarjeta: solo se pega el link. */
export default function AddOffer({ product, onDone }: { product: Product; onDone: () => void }) {
  const [datos, setDatos] = useState<Lectura | null>(null);
  const [url, setUrl] = useState("");
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState<Moneda>("USD");
  const [envio, setEnvio] = useState("0");
  const [avisos, setAvisos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, startTransition] = useTransition();
  const [clave, setClave] = useState(0);

  const alLeer = (d: Lectura | null, u: string, av: string[], err: string | null) => {
    setDatos(d);
    setUrl(u);
    setPrecio(d?.price_usd != null ? String(d.price_usd) : "");
    setMoneda(d?.currency ?? "USD");
    setEnvio(String(d?.shipping_usd ?? 0));
    const extra: string[] = [];
    if (d?.color && product.color && normalizar(d.color) !== normalizar(product.color)) {
      extra.push(`Ojo: este link parece ser del color "${d.color}", y esta tarjeta es "${product.color}".`);
    }
    setAvisos([...extra, ...av.filter((a) => !a.startsWith("No encontré el color"))]);
    setError(err);
  };

  const guardar = () => {
    if (!datos) return;
    startTransition(async () => {
      const r = await agregarOferta(product.id, {
        url,
        store: datos.store,
        price_usd: precio.trim() ? Number(precio.replace(",", ".")) : null,
        shipping_usd: Number(envio.replace(",", ".")) || 0,
        currency: moneda,
        status: datos.status ?? "EN STOCK",
        image_url: datos.image_url,
      });
      if (r.ok) {
        setDatos(null);
        setPrecio("");
        setAvisos([]);
        setClave((k) => k + 1);
        onDone();
      } else setError(r.error);
    });
  };

  return (
    <div className="add-offer">
      <LinkReader key={clave} onLeido={alLeer} etiqueta="AGREGAR OTRA TIENDA · PEGA EL LINK" />
      {error && <p className="error">{error}</p>}
      {avisos.map((a) => (
        <p key={a} className="notice">{a}</p>
      ))}
      {datos && (
        <div className="offer-edit">
          <div className="field">
            <span>TIENDA</span>
            <p className="detected">{datos.store}</p>
          </div>
          <label className="field">
            <span>MONEDA</span>
            <select value={moneda} onChange={(e) => setMoneda(e.target.value as Moneda)}>
              <option value="USD">DÓLARES ($)</option>
              <option value="BOB">BOLIVIANOS (Bs)</option>
              <option value="EUR">EUROS (€)</option>
            </select>
          </label>
          <label className="field">
            <span>PRECIO</span>
            <input type="number" step="0.01" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </label>
          <label className="field">
            <span>ENVÍO</span>
            <input type="number" step="0.01" min="0" value={envio} onChange={(e) => setEnvio(e.target.value)} />
          </label>
          <button type="button" className="btn btn-primary" onClick={guardar} disabled={guardando} style={{ alignSelf: "flex-end" }}>
            {guardando ? "…" : "GUARDAR OFERTA"}
          </button>
        </div>
      )}
    </div>
  );
}
