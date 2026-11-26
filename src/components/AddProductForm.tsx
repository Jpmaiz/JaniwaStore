"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { agregarOferta, crearProducto } from "@/app/actions";
import type { Lectura } from "@/lib/scraper";
import { CATEGORIES, STATUSES, type Moneda, type Product, type Status } from "@/lib/types";
import { adivinarCategoria, detectarTienda, mismoProducto } from "@/lib/tiendas";
import { CloseButton } from "./Dialog";
import LinkReader from "./LinkReader";
import ImagePicker from "./ImagePicker";

type Campos = {
  url: string;
  name: string;
  color: string;
  category: string;
  destino: "venta" | "personal";
  notes: string;
  image_url: string;
  store: string;
  price: string;
  shipping: string;
  moneda: Moneda;
  status: Status;
};

const VACIO: Campos = {
  url: "",
  name: "",
  color: "",
  category: "OTROS",
  destino: "venta",
  notes: "",
  image_url: "",
  store: "",
  price: "",
  shipping: "0",
  moneda: "USD",
  status: "EN STOCK",
};

export default function AddProductForm({
  products,
  onDone,
}: {
  products: Product[];
  onDone: (res?: { id: number; nueva: boolean }) => void;
}) {
  const [c, setC] = useState<Campos>(VACIO);
  const [leido, setLeido] = useState(false);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, startTransition] = useTransition();
  // true cuando tú eliges la categoría a mano: desde ahí no la cambiamos solos
  const [catManual, setCatManual] = useState(false);
  const [catLeida, setCatLeida] = useState(false);
  const [detectado, setDetectado] = useState<{ genero: Lectura["genero"]; subcategoria: string | null }>({ genero: null, subcategoria: null });

  // Mientras escribes el nombre, sugerimos la categoría
  useEffect(() => {
    if (catManual || catLeida) return;
    const t = setTimeout(() => {
      const cat = adivinarCategoria(c.name);
      setC((prev) => ({ ...prev, category: cat ?? "OTROS" }));
    }, 250);
    return () => clearTimeout(t);
  }, [c.name, catManual, catLeida]);

  const set = <K extends keyof Campos>(k: K, v: Campos[K]) => setC((prev) => ({ ...prev, [k]: v }));

  const alLeer = (data: Lectura | null, url: string, av: string[], err: string | null) => {
    const tienda = detectarTienda(url);
    setC((prev) => ({
      ...prev,
      url,
      store: data?.store ?? tienda?.store ?? prev.store,
      shipping: String(data?.shipping_usd ?? tienda?.envio ?? prev.shipping),
      moneda: data?.currency ?? tienda?.moneda ?? prev.moneda,
      name: data?.name ?? prev.name,
      color: data?.color ?? prev.color,
      category: data?.category ?? prev.category,
      image_url: data?.image_url ?? prev.image_url,
      price: data?.price_usd != null ? String(data.price_usd) : prev.price,
      status: data?.status ?? prev.status,
    }));
    setCatLeida(!!data?.category);
    setDetectado({ genero: data?.genero ?? null, subcategoria: data?.subcategoria ?? null });
    setAvisos(av);
    setError(err);
    setLeido(true);
  };

  // ¿Ya existe una tarjeta con este modelo y color?
  const coincidencia = useMemo(
    () => (c.name.trim() ? products.find((p) => mismoProducto(p, c.name, c.color || null)) ?? null : null),
    [products, c.name, c.color],
  );

  const oferta = () => ({
    url: c.url || null,
    store: c.store || "OTRA",
    price_usd: c.price.trim() ? Number(c.price.replace(",", ".")) : null,
    shipping_usd: Number(c.shipping.replace(",", ".")) || 0,
    currency: c.moneda,
    status: c.status,
    image_url: c.image_url || null,
  });

  const crearNueva = () => {
    if (!c.name.trim()) return setError("Escribe el nombre del modelo.");
    startTransition(async () => {
      const r = await crearProducto({
        name: c.name,
        color: c.color || null,
        category: c.category,
        destino: c.destino,
        notes: c.notes || null,
        image_url: c.image_url || null,
        genero: detectado.genero,
        subcategoria: detectado.subcategoria,
        oferta: oferta(),
      });
      if (r.ok && r.id) onDone({ id: r.id, nueva: true });
      else if (!r.ok) setError(r.error);
    });
  };

  const unirA = (p: Product) => {
    startTransition(async () => {
      const r = await agregarOferta(p.id, oferta());
      if (r.ok) onDone({ id: p.id, nueva: false });
      else setError(r.error);
    });
  };

  const mostrarCampos = leido || c.name;

  return (
    <div className="sheet-body" style={{ flex: "1 1 100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 32 }}>Agregar producto</h3>
        <CloseButton onClick={() => onDone()} />
      </div>

      <div className="form">
        <LinkReader onLeido={alLeer} autoFocus />

        {!mostrarCampos && (
          <button type="button" className="small muted" style={{ alignSelf: "flex-start", minHeight: 32 }} onClick={() => setLeido(true)}>
            O LLENAR A MANO →
          </button>
        )}

        {error && <p className="error">{error}</p>}
        {avisos.map((a) => (
          <p key={a} className="notice">{a}</p>
        ))}

        {mostrarCampos && (
          <>
            <div className="form-grid">
              <label className="field">
                <span>MODELO *</span>
                <input type="text" value={c.name} onChange={(e) => set("name", e.target.value)} />
              </label>
              <label className="field">
                <span>COLOR (SEPARA LAS TARJETAS)</span>
                <input type="text" value={c.color} placeholder="Ej. Negro/Blanco" onChange={(e) => set("color", e.target.value)} />
              </label>
            </div>

            <ImagePicker value={c.image_url || null} onChange={(u) => set("image_url", u ?? "")} />

            <div className="form-grid">
              <div className="field">
                <span>TIENDA</span>
                {c.url ? (
                  <p className="detected">{c.store || "—"} <span className="muted">· DETECTADA DEL LINK</span></p>
                ) : (
                  <input type="text" value={c.store} placeholder="Ej. VANS" onChange={(e) => set("store", e.target.value.toUpperCase())} />
                )}
              </div>
              <label className="field">
                <span>CATEGORÍA</span>
                <select
                  value={c.category}
                  onChange={(e) => {
                    setCatManual(true);
                    set("category", e.target.value);
                  }}
                >
                  {CATEGORIES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>MONEDA</span>
                <select value={c.moneda} onChange={(e) => set("moneda", e.target.value as Moneda)}>
              <option value="USD">DÓLARES ($)</option>
              <option value="BOB">BOLIVIANOS (Bs)</option>
              <option value="EUR">EUROS (€)</option>
            </select>
              </label>
              <label className="field">
                <span>PRECIO ({c.moneda === "BOB" ? "Bs" : c.moneda === "EUR" ? "€" : "$"})</span>
                <input type="number" step="0.01" min="0" value={c.price} onChange={(e) => set("price", e.target.value)} />
              </label>
              <label className="field">
                <span>{c.moneda === "BOB" ? "ENVÍO / ENTREGA (Bs)" : `ENVÍO EN USA (${c.moneda === "EUR" ? "€" : "$"})`}</span>
                <input type="number" step="0.01" min="0" value={c.shipping} onChange={(e) => set("shipping", e.target.value)} />
              </label>
              <label className="field">
                <span>ESTADO</span>
                <select value={c.status} onChange={(e) => set("status", e.target.value as Status)}>
                  {STATUSES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>DESTINO</span>
                <select value={c.destino} onChange={(e) => set("destino", e.target.value as Campos["destino"])}>
                  <option value="venta">PARA VENTA</option>
                  <option value="personal">USO PERSONAL</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>NOTAS</span>
              <textarea rows={2} value={c.notes} onChange={(e) => set("notes", e.target.value)} />
            </label>

            {coincidencia ? (
              <div className="match">
                <p className="label">YA TIENES ESTE MODELO Y COLOR</p>
                <p className="muted">
                  {coincidencia.name}
                  {coincidencia.color ? ` · ${coincidencia.color}` : ""} · {coincidencia.offers.length} oferta(s)
                </p>
                <div className="actions">
                  <button type="button" className="btn btn-primary" disabled={guardando} onClick={() => unirA(coincidencia)} style={{ flex: 1 }}>
                    {guardando ? "GUARDANDO…" : "AGREGAR COMO OFERTA AHÍ"}
                  </button>
                  <button type="button" className="btn" disabled={guardando} onClick={crearNueva}>
                    CREAR TARJETA NUEVA
                  </button>
                </div>
              </div>
            ) : (
              <div className="actions">
                <button type="button" className="btn btn-primary" disabled={guardando} onClick={crearNueva} style={{ flex: 1 }}>
                  {guardando ? "GUARDANDO…" : "GUARDAR EN WISHLIST"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
