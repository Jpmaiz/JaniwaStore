"use client";

import { useId, useState } from "react";
import { borrarFoto, subirFoto } from "@/app/actions";
import { prepararFoto } from "@/lib/foto";

/** Subir fotos desde el celular o la compu. La primera es la portada. */
export default function SubidorFotos({
  fotos,
  onChange,
  max = 8,
  carpeta = "prendas",
}: {
  fotos: string[];
  onChange: (f: string[]) => void;
  max?: number;
  carpeta?: "prendas" | "anuncios";
}) {
  const id = useId();
  const [subiendo, setSubiendo] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const lleno = fotos.length + subiendo >= max;

  const elegir = async (lista: FileList | null) => {
    if (!lista?.length) return;
    setError(null);
    const archivos = Array.from(lista).slice(0, max - fotos.length);
    setSubiendo(archivos.length);
    let actuales = fotos;
    for (const a of archivos) {
      try {
        const datos = new FormData();
        datos.append("foto", await prepararFoto(a));
        datos.append("carpeta", carpeta);
        const r = await subirFoto(datos);
        if (!r.ok) throw new Error(r.error);
        actuales = [...actuales, r.url];
        onChange(actuales);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
      }
      setSubiendo((n) => n - 1);
    }
  };

  const quitar = (url: string) => {
    onChange(fotos.filter((f) => f !== url));
    void borrarFoto(url);
  };
  const portada = (url: string) => onChange([url, ...fotos.filter((f) => f !== url)]);

  return (
    <div className="fotos">
      <div className="fotos-grid">
        {fotos.map((f, i) => (
          <figure key={f} className="foto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f} alt={`Foto ${i + 1}`} />
            {i === 0 && max > 1 && <span className="foto-tag">PORTADA</span>}
            <div className="foto-acciones">
              {i > 0 && (
                <button type="button" onClick={() => portada(f)} aria-label={`Usar foto ${i + 1} como portada`}>
                  ★
                </button>
              )}
              <button type="button" onClick={() => quitar(f)} aria-label={`Quitar foto ${i + 1}`}>
                ✕
              </button>
            </div>
          </figure>
        ))}
        {Array.from({ length: subiendo }, (_, i) => (
          <div key={`s${i}`} className="foto foto-cargando tex" aria-hidden="true">
            <span className="small">SUBIENDO…</span>
          </div>
        ))}
        {!lleno && (
          <label htmlFor={id} className="foto foto-nueva">
            <span style={{ fontSize: 26, lineHeight: 1 }}>+</span>
            <span className="small">{fotos.length ? "OTRA FOTO" : max > 1 ? "AGREGAR FOTOS" : "AGREGAR FOTO"}</span>
          </label>
        )}
      </div>
      <input
        id={id}
        className="sr-only"
        type="file"
        accept="image/*"
        multiple={max > 1}
        disabled={lleno}
        onChange={(e) => {
          void elegir(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="small muted">
        {max > 1 ? `Hasta ${max} fotos · la primera es la portada (★ para cambiarla)` : "Foto horizontal, se recorta al ancho de la pantalla"}
      </p>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
