"use client";

import { useState, useTransition } from "react";
import type { Product, Settings } from "@/lib/types";
import { codigo, imagenDe, money, precio, resumir } from "@/lib/calc";
import { enlacesBusqueda } from "@/lib/tiendas";
import { cambiarCategoria, cambiarImagenProducto, revisarPrecios } from "@/app/actions";
import { CATEGORIES } from "@/lib/types";
import ImagePicker from "./ImagePicker";
import VentaPanel from "./VentaPanel";
import { useConfirm } from "./Confirm";
import Row from "./Row";
import Dialog, { CloseButton } from "./Dialog";
import OfferRow from "./OfferRow";
import AddOffer from "./AddOffer";

export default function ProductSheet({
  product,
  settings,
  paralelo,
  euroUsd,
  onClose,
  onEliminar,
  onPrev,
  onNext,
}: {
  product: Product;
  settings: Settings;
  paralelo: number | null;
  euroUsd: number | null;
  onClose: () => void;
  onEliminar: (id: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [pendiente, startTransition] = useTransition();
  const confirmar = useConfirm();
  const [revision, setRevision] = useState<string[] | null>(null);
  const r = resumir(product, settings, paralelo, euroUsd);
  const hayEurSinCambio = !euroUsd && product.offers.some((o) => o.currency === "EUR");
  const c = r.mejor?.costo ?? null;
  const img = imagenDe(product, r);
  const conLink = product.offers.some((o) => o.url);

  const borrar = async () => {
    const n = product.offers.length;
    const ok = await confirmar({
      titulo: "¿Eliminar producto?",
      mensaje: product.color ? `${product.name} · ${product.color}` : product.name,
      detalle: `Se borran la tarjeta y ${n === 1 ? "su oferta" : `sus ${n} ofertas`}. No se puede deshacer.`,
      confirmar: "ELIMINAR",
    });
    if (ok) onEliminar(product.id);
  };

  const revisar = () =>
    startTransition(async () => {
      setRevision(null);
      const res = await revisarPrecios(product.id);
      if (!res.ok) return setRevision([res.error]);
      const lineas = res.cambios.length ? res.cambios : ["Sin cambios: los precios siguen igual."];
      if (res.errores) lineas.push(`${res.errores} tienda(s) no se pudieron leer.`);
      setRevision(lineas);
    });

  return (
    <Dialog label={product.name} onClose={onClose} wide>
      <div className="sheet-media tex">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} />
        ) : (
          <div className="placeholder" style={{ position: "absolute", inset: 0, fontSize: 11 }}>
            [ SIN IMAGEN ]
          </div>
        )}
        <div className="media-edit">
          <ImagePicker
            compacto
            value={null}
            onChange={(u) => startTransition(async () => void (await cambiarImagenProducto(product.id, u)))}
          />
        </div>
      </div>

      <div className="sheet-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="small muted">{codigo(product.id)} · COMPARADOR</span>
          <CloseButton onClick={onClose} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3>{product.name}</h3>
          <p className="small muted" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
            {product.color ? `${product.color.toUpperCase()} · ` : ""}
            <select
              className="inline-select"
              aria-label="Categoría"
              value={product.category}
              disabled={pendiente}
              onChange={(e) => {
                const cat = e.target.value;
                startTransition(async () => void (await cambiarCategoria(product.id, cat)));
              }}
            >
              {CATEGORIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            · {product.destino === "personal" ? "USO PERSONAL" : "PARA VENTA"}
          </p>
        </div>

        {/* Ofertas, de la más barata a la más cara */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="row-head label">
            <span>{r.tiendas} {r.tiendas === 1 ? "TIENDA" : "TIENDAS"}</span>
            <span>TOTAL EN MANO</span>
          </div>
          <ul className="offer-list">
            {r.ordenadas.map(({ offer, costo }) => (
              <OfferRow key={offer.id} offer={offer} costo={costo} esMejor={r.mejor?.offer.id === offer.id} />
            ))}
          </ul>
          {(r.ahorroBs ?? r.ahorroUsd ?? 0) > 0.009 && (
            <p className="saving">
              Ahorras {r.ahorroBs != null ? `Bs ${money(r.ahorroBs)}` : `$ ${money(r.ahorroUsd)}`} comprando en{" "}
              {r.mejor?.offer.store} frente a la más cara.
            </p>
          )}
          {hayEurSinCambio && (
            <p className="notice">No se pudo obtener el cambio del euro. Ponlo a mano en Ajustes para comparar las ofertas en €.</p>
          )}
          <div className="actions">
            <button type="button" className="btn" onClick={revisar} disabled={pendiente || !conLink}>
              {pendiente ? "REVISANDO…" : "↻ REVISAR PRECIOS"}
            </button>
          </div>
          {revision?.map((l) => (
            <p key={l} className="notice">{l}</p>
          ))}
        </div>

        <VentaPanel key={product.id} product={product} costoBs={c?.totalBs ?? null} />

        <AddOffer product={product} onDone={() => setRevision(null)} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="label">BUSCAR MÁS BARATO EN</span>
          <div className="chips">
            {enlacesBusqueda(product.name, product.color).map((e) => (
              <a key={e.nombre} className="chip" href={e.url} target="_blank" rel="noreferrer">
                {e.nombre} ↗
              </a>
            ))}
          </div>
        </div>

        {/* Desglose de la mejor oferta */}
        {c && c.local && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
            <div className="row-head label" style={{ paddingBottom: 6 }}>
              <span>DESGLOSE · {r.mejor?.offer.store} · EN BOLIVIA</span>
              <span>Bs</span>
            </div>
            <Row label="PRECIO TIENDA" value={money(c.precio)} />
            <Row label="ENVÍO / ENTREGA" value={money(c.envio)} />
            <Row className="muted" label="SIN TAX, COLCHÓN NI CAMBIO" value="—" />
          </div>
        )}
        {c && !c.local && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
            <div className="row-head label" style={{ paddingBottom: 6 }}>
              <span>DESGLOSE · {r.mejor?.offer.store}</span>
              <span>USD</span>
            </div>
            {c.precioEur != null && (
              <Row
                className="muted"
                label={`PRECIO EN EUROS (1 € = $ ${euroUsd?.toLocaleString("es-BO", { maximumFractionDigits: 4 })})`}
                value={precio("EUR", c.precioEur + (c.envioEur ?? 0))}
              />
            )}
            <Row label="PRECIO TIENDA" value={money(c.precio)} />
            <Row label="ENVÍO DENTRO DE USA" value={money(c.envio)} />
            <Row label={`TAX (${settings.tax_pct} %)`} value={money(c.tax)} />
            <Row label={`COLCHÓN (${settings.colchon_pct} %)`} value={money(c.colchon)} />
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 4, fontWeight: 600 }}>
              <Row label="EN TUS MANOS (USA)" value={`$ ${money(c.totalUsd)}`} />
            </div>
            <Row className="muted" label="× PARALELO" value={paralelo ? `Bs ${money(paralelo)}` : "SIN DATO"} />
          </div>
        )}

        <div className="total">
          <span className="label">{c ? "MEJOR TOTAL EN BS" : r.estado}</span>
          <span className="total-num">{c?.totalBs != null ? `Bs ${money(c.totalBs)}` : "—"}</span>
        </div>

        {product.notes && <p className="muted" style={{ lineHeight: 1.6 }}>{product.notes}</p>}

        <div className="actions">
          <button className="btn" onClick={onPrev}>← ANTERIOR</button>
          <button className="btn" onClick={onNext}>SIGUIENTE →</button>
          <button className="btn" onClick={borrar} disabled={pendiente} style={{ marginLeft: "auto" }}>
            ELIMINAR
          </button>
        </div>
      </div>
    </Dialog>
  );
}
