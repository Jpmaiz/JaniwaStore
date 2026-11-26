"use client";

import { useState, useTransition } from "react";
import { editarOferta, eliminarOferta } from "@/app/actions";
import type { Costo } from "@/lib/calc";
import { fechaCorta, money, precio as fmt } from "@/lib/calc";
import { STATUSES, type Moneda, type Offer, type Status } from "@/lib/types";
import { useConfirm } from "./Confirm";

export default function OfferRow({
  offer,
  costo,
  esMejor,
}: {
  offer: Offer;
  costo: Costo | null;
  esMejor: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [precio, setPrecio] = useState(offer.price_usd != null ? String(offer.price_usd) : "");
  const [envio, setEnvio] = useState(String(offer.shipping_usd));
  const [estado, setEstado] = useState<Status>(offer.status);
  const [moneda, setMoneda] = useState<Moneda>(offer.currency ?? "USD");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();
  const confirmar = useConfirm();

  const guardar = () =>
    startTransition(async () => {
      const r = await editarOferta(offer.id, {
        price_usd: precio.trim() ? Number(precio.replace(",", ".")) : null,
        shipping_usd: Number(envio.replace(",", ".")) || 0,
        currency: moneda,
        status: estado,
      });
      if (r.ok) setEditando(false);
      else setError(r.error);
    });

  const borrar = async () => {
    const ok = await confirmar({
      titulo: "¿Quitar oferta?",
      mensaje: `Oferta de ${offer.store}`,
      detalle: "La tarjeta y las demás ofertas se quedan.",
      confirmar: "QUITAR",
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await eliminarOferta(offer.id);
      if (!r.ok) setError(r.error);
    });
  };

  const agotado = offer.status === "AGOTADO";

  return (
    <li className={`offer ${esMejor ? "offer-best" : ""} ${agotado ? "offer-out" : ""}`}>
      <div className="offer-main">
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <span className="offer-store">
            {esMejor && <span className="best-mark">★ MEJOR · </span>}
            {offer.store}
          </span>
          <span className="small muted">
            {offer.price_usd != null ? fmt(offer.currency, offer.price_usd) : "SIN PRECIO"} + ENVÍO{" "}
            {fmt(offer.currency, offer.shipping_usd)}
            {offer.currency === "BOB" ? " · EN BOLIVIA" : ""}
            {offer.status !== "EN STOCK" ? ` · ${offer.status}` : ""}
          </span>
        </div>
        <span className="offer-total">
          {costo?.totalBs != null
            ? `Bs ${money(costo.totalBs)}`
            : offer.currency === "EUR" && offer.price_usd != null
              ? "SIN CAMBIO €"
              : "—"}
        </span>
      </div>

      <div className="offer-meta small muted">
        <span>
          REVISADO {fechaCorta(offer.checked_at ?? offer.created_at)}
          {offer.check_error ? " · NO SE PUDO LEER" : ""}
        </span>
        <span className="offer-links">
          {offer.url && (
            <a href={offer.url} target="_blank" rel="noreferrer">
              ABRIR ↗
            </a>
          )}
          <button type="button" onClick={() => setEditando((v) => !v)} disabled={pendiente}>
            {editando ? "CANCELAR" : "EDITAR"}
          </button>
          <button type="button" onClick={borrar} disabled={pendiente}>
            QUITAR
          </button>
        </span>
      </div>

      {offer.check_error && !editando && <p className="notice">{offer.check_error}</p>}

      {editando && (
        <div className="offer-edit">
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
          <label className="field">
            <span>ESTADO</span>
            <select value={estado} onChange={(e) => setEstado(e.target.value as Status)}>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn-primary" onClick={guardar} disabled={pendiente} style={{ alignSelf: "flex-end" }}>
            {pendiente ? "…" : "GUARDAR"}
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </li>
  );
}
