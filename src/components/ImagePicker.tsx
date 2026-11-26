"use client";

import { useEffect, useState } from "react";

/** Link de la imagen con vista previa (clic derecho en la foto › "Copiar dirección de imagen"). */
export default function ImagePicker({
  value,
  onChange,
  compacto = false,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  compacto?: boolean;
}) {
  const [texto, setTexto] = useState(value ?? "");
  const [rota, setRota] = useState(false);

  useEffect(() => {
    setTexto(value ?? "");
    setRota(false);
  }, [value]);

  const aplicar = (v: string) => {
    const u = v.trim();
    if (!u) return onChange(null);
    if (!/^https?:\/\//i.test(u)) return setRota(true);
    setRota(false);
    onChange(u);
  };

  return (
    <div className="field">
      {!compacto && <span>LINK DE LA IMAGEN</span>}
      <div className={`drop ${compacto ? "drop-compacto" : ""}`}>
        {!compacto && value && !rota && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Vista previa" onError={() => setRota(true)} />
        )}
        <div className="drop-text" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, width: "100%" }}>
            <input
              type="url"
              className="tag-input"
              value={texto}
              placeholder="Clic derecho en la foto › Copiar dirección de imagen"
              onChange={(e) => setTexto(e.target.value)}
              onPaste={(e) => {
                const pegado = e.clipboardData.getData("text").trim();
                if (pegado) {
                  e.preventDefault();
                  setTexto(pegado);
                  aplicar(pegado);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  aplicar(texto);
                }
              }}
              onBlur={() => !compacto && texto.trim() !== (value ?? "") && aplicar(texto)}
              style={{ flex: 1, minWidth: 0 }}
              aria-label="Link de la imagen"
            />
            {compacto && (
              <button type="button" className="btn" onClick={() => aplicar(texto)} disabled={!texto.trim()}>
                USAR
              </button>
            )}
          </div>
          {rota && <span className="small error">Ese link no muestra una imagen. Copia la dirección de la imagen, no de la página.</span>}
        </div>
      </div>
    </div>
  );
}
