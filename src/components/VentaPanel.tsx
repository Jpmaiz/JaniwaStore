"use client";

import { useState, useTransition } from "react";
import { guardarVenta } from "@/app/actions";
import { money } from "@/lib/calc";
import type { Disponibilidad, Product } from "@/lib/types";
import Row from "./Row";
import { adivinarGenero, adivinarTipo, TIPOS_ROPA, type Genero } from "@/lib/catalogo";

const num = (v: string) => (v.trim() ? Number(v.replace(",", ".")) : null);

/** Sección "Venta" de la ficha: lo que verá el cliente en la tienda */
export default function VentaPanel({ product, costoBs }: { product: Product; costoBs: number | null }) {
  const [publicado, setPublicado] = useState(product.publicado);
  const [precio, setPrecio] = useState(product.precio_venta_bs != null ? String(product.precio_venta_bs) : "");
  const [minimo, setMinimo] = useState(product.precio_minimo_bs != null ? String(product.precio_minimo_bs) : "");
  const [tallas, setTallas] = useState(product.tallas.join(", "));
  const [disp, setDisp] = useState<Disponibilidad>(product.disponibilidad);
  const [llegada, setLlegada] = useState(product.llegada_estimada ?? "");
  const [descripcion, setDescripcion] = useState(product.descripcion ?? "");
  // si aún no se definió, proponemos lo que se deduce del nombre
  const generoSugerido = product.genero ?? adivinarGenero(`${product.name} ${product.color ?? ""}`);
  const [genero, setGenero] = useState<Genero | "">(generoSugerido ?? "unisex");
  const esRopa = product.category === "ROPA";
  const tipoSugerido = product.subcategoria ?? (esRopa ? adivinarTipo(product.name) : null);
  const [tipo, setTipo] = useState(tipoSugerido ?? "");
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardando, startTransition] = useTransition();

  const p = num(precio);
  const m = num(minimo);
  const ganancia = p != null && costoBs != null ? p - costoBs : null;
  const gananciaMin = m != null && costoBs != null ? m - costoBs : null;
  const pct = (g: number | null) => (g != null && costoBs ? ` · ${Math.round((g / costoBs) * 100)} %` : "");

  const guardar = () =>
    startTransition(async () => {
      const r = await guardarVenta(product.id, {
        publicado,
        precio_venta_bs: p,
        precio_minimo_bs: m,
        tallas: tallas.split(/[,;]+/).map((t) => t.trim()).filter(Boolean),
        disponibilidad: disp,
        llegada_estimada: llegada || null,
        descripcion: descripcion || null,
        genero: genero || null,
        subcategoria: esRopa ? tipo || null : null,
      });
      setMensaje(r.ok ? { ok: true, texto: publicado ? "Guardado · visible en la tienda" : "Guardado · oculto en la tienda" } : { ok: false, texto: r.error });
    });

  return (
    <section className="venta" aria-labelledby={`venta-${product.id}`}>
      <div className="venta-head">
        <h4 id={`venta-${product.id}`}>Venta</h4>
        <label className="switch">
          <input type="checkbox" checked={publicado} onChange={(e) => setPublicado(e.target.checked)} />
          <span className="switch-ui" aria-hidden="true" />
          <span className="small">{publicado ? "PUBLICADO EN LA TIENDA" : "NO PUBLICADO"}</span>
        </label>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>PRECIO DE VENTA (Bs)</span>
          <input type="number" step="1" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </label>
        <label className="field">
          <span>PRECIO MÍNIMO (Bs)</span>
          <input type="number" step="1" min="0" value={minimo} onChange={(e) => setMinimo(e.target.value)} />
        </label>
      </div>

      {costoBs != null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
          <Row className="muted" label="TU COSTO (MEJOR OFERTA)" value={`Bs ${money(costoBs)}`} />
          <Row label="GANANCIA A PRECIO DE VENTA" value={ganancia != null ? `Bs ${money(ganancia)}${pct(ganancia)}` : "—"} />
          <Row className="muted" label="GANANCIA A PRECIO MÍNIMO" value={gananciaMin != null ? `Bs ${money(gananciaMin)}${pct(gananciaMin)}` : "—"} />
        </div>
      )}

      <div className="form-grid">
        <label className="field">
          <span>DISPONIBILIDAD</span>
          <select value={disp} onChange={(e) => setDisp(e.target.value as Disponibilidad)}>
            <option value="encargo">POR ENCARGO</option>
            <option value="stock">EN STOCK (LO TENGO)</option>
          </select>
        </label>
        {disp === "encargo" ? (
          <label className="field">
            <span>LLEGADA ESTIMADA</span>
            <input type="date" value={llegada} onChange={(e) => setLlegada(e.target.value)} />
          </label>
        ) : (
          <div />
        )}
      </div>

      <div className="form-grid">
        <label className="field">
          <span>DEPARTAMENTO{!product.genero && generoSugerido ? " · SUGERIDO" : ""}</span>
          <select value={genero} onChange={(e) => setGenero(e.target.value as Genero)}>
            <option value="unisex">UNISEX (MUJER Y HOMBRE)</option>
            <option value="mujer">MUJER</option>
            <option value="hombre">HOMBRE</option>
          </select>
        </label>
        {esRopa ? (
          <label className="field">
            <span>TIPO DE PRENDA{!product.subcategoria && tipoSugerido ? " · SUGERIDO" : ""}</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">SIN DEFINIR</option>
              {TIPOS_ROPA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="field">
            <span>SECCIÓN EN LA TIENDA</span>
            <p className="detected">{product.category}</p>
          </div>
        )}
      </div>

      <label className="field">
        <span>TALLAS (SEPARADAS POR COMA)</span>
        <input type="text" value={tallas} placeholder="Ej. 40, 41, 42 · o S, M, L" onChange={(e) => setTallas(e.target.value)} />
      </label>
      <label className="field">
        <span>DESCRIPCIÓN PARA EL CLIENTE</span>
        <textarea rows={2} value={descripcion} placeholder="Opcional: material, cómo talla, original con caja…" onChange={(e) => setDescripcion(e.target.value)} />
      </label>

      <div className="actions" style={{ alignItems: "center" }}>
        <button type="button" className="btn btn-primary" onClick={guardar} disabled={guardando}>
          {guardando ? "GUARDANDO…" : "GUARDAR VENTA"}
        </button>
        {product.interes > 0 && (
          <span className="small muted">{product.interes} {product.interes === 1 ? "PERSONA TOCÓ" : "PERSONAS TOCARON"} «LO QUIERO»</span>
        )}
        {publicado && (
          <a className="small" href={`/producto/${product.id}`} target="_blank" rel="noreferrer" style={{ color: "var(--cream)" }}>
            VER EN LA TIENDA ↗
          </a>
        )}
      </div>
      {mensaje && <p className={mensaje.ok ? "notice" : "error"}>{mensaje.texto}</p>}
    </section>
  );
}
