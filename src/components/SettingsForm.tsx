"use client";

import { useActionState, useEffect } from "react";
import { guardarAjustes } from "@/app/actions";
import type { Settings } from "@/lib/types";
import { money } from "@/lib/calc";
import { CloseButton } from "./Dialog";

export default function SettingsForm({
  settings,
  paraleloAuto,
  euroAuto,
  onDone,
}: {
  settings: Settings;
  paraleloAuto: number | null;
  euroAuto: number | null;
  onDone: () => void;
}) {
  const [estado, accion, enviando] = useActionState(guardarAjustes, null);

  useEffect(() => {
    if (estado?.ok) onDone();
  }, [estado, onDone]);

  return (
    <div className="sheet-body" style={{ flex: "1 1 100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 32 }}>Ajustes de cálculo</h3>
        <CloseButton onClick={onDone} />
      </div>

      <form action={accion} className="form">
        <div className="form-grid">
          <label className="field">
            <span>TAX DEL ESTADO (%)</span>
            <input name="tax_pct" type="number" step="0.01" min="0" defaultValue={settings.tax_pct} />
          </label>
          <label className="field">
            <span>COLCHÓN (%)</span>
            <input name="colchon_pct" type="number" step="0.5" min="0" defaultValue={settings.colchon_pct} />
          </label>
        </div>
        <label className="field">
          <span>DÓLAR PARALELO MANUAL (BS) · VACÍO = AUTOMÁTICO</span>
          <input
            name="paralelo_manual"
            type="number"
            step="0.01"
            min="0"
            defaultValue={settings.paralelo_manual ?? ""}
            placeholder={paraleloAuto ? `Automático: ${money(paraleloAuto)}` : "Sin dato automático"}
          />
        </label>

        <label className="field">
          <span>1 EURO EN DÓLARES (MANUAL) · VACÍO = AUTOMÁTICO</span>
          <input
            name="eur_usd_manual"
            type="number"
            step="0.0001"
            min="0"
            defaultValue={settings.eur_usd_manual ?? ""}
            placeholder={euroAuto ? `Automático: ${euroAuto.toLocaleString("es-BO", { maximumFractionDigits: 4 })}` : "Sin dato automático"}
          />
        </label>

        {estado && !estado.ok && <p className="error">{estado.error}</p>}

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={enviando} style={{ flex: 1 }}>
            {enviando ? "GUARDANDO…" : "GUARDAR AJUSTES"}
          </button>
        </div>
      </form>
    </div>
  );
}
