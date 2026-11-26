"use client";

import { useState, useTransition } from "react";
import { leerLink } from "@/app/actions";
import type { Lectura } from "@/lib/scraper";

/**
 * Campo para pegar un link: al pegar, lee la página solo.
 * Devuelve lo que encontró (aunque falle, devuelve la tienda detectada).
 */
export default function LinkReader({
  onLeido,
  autoFocus = false,
  etiqueta = "LINK DEL PRODUCTO",
}: {
  onLeido: (data: Lectura | null, url: string, avisos: string[], error: string | null) => void;
  autoFocus?: boolean;
  etiqueta?: string;
}) {
  const [url, setUrl] = useState("");
  const [leyendo, startTransition] = useTransition();

  const leer = (valor: string) => {
    const u = valor.trim();
    if (!u) return;
    startTransition(async () => {
      const r = await leerLink(u);
      if (r.ok) onLeido(r.data, u, r.avisos, null);
      else onLeido(r.data, u, [], r.error);
    });
  };

  return (
    <div className="field">
      <span>{etiqueta}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="url"
          value={url}
          autoFocus={autoFocus}
          placeholder="Pega aquí el link y se lee solo"
          onChange={(e) => setUrl(e.target.value)}
          onPaste={(e) => {
            const pegado = e.clipboardData.getData("text");
            if (pegado) {
              e.preventDefault();
              setUrl(pegado.trim());
              leer(pegado);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              leer(url);
            }
          }}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button type="button" className="btn" onClick={() => leer(url)} disabled={leyendo || !url.trim()}>
          {leyendo ? "LEYENDO…" : "LEER"}
        </button>
      </div>
    </div>
  );
}
