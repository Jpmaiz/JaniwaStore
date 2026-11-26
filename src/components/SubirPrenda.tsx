"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { crearPrenda } from "@/app/actions";
import { adivinarGenero, adivinarTipo, TIPOS_ROPA, type Genero } from "@/lib/catalogo";
import { CATEGORIES } from "@/lib/types";
import Sidebar from "./Sidebar";
import SubidorFotos from "./SubidorFotos";

const TALLAS_ROPA = ["XS", "S", "M", "L", "XL", "XXL"];
const TALLAS_ZAP = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44"];
const num = (v: string) => (v.trim() ? Number(v.replace(",", ".")) : null);

/** Formulario para subir una prenda que ya tienes (o vas a traer) sin link de tienda */
export default function SubirPrenda() {
  const [fotos, setFotos] = useState<string[]>([]);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("");
  const [categoria, setCategoria] = useState("ROPA");
  const [genero, setGenero] = useState<Genero | null>(null); // null = aún sin tocar → sugerido
  const [tipo, setTipo] = useState<string | null>(null);
  const [talla, setTalla] = useState(""); // pieza única: una sola talla
  const [otraTalla, setOtraTalla] = useState("");
  const [precio, setPrecio] = useState("");
  const [minimo, setMinimo] = useState("");
  const [costo, setCosto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [publicar, setPublicar] = useState(true);
  const [resultado, setResultado] = useState<{ ok: true; id: number; publicado: boolean } | { ok: false; error: string } | null>(null);
  const [guardando, startTransition] = useTransition();

  const esRopa = categoria === "ROPA";
  const generoFinal = genero ?? adivinarGenero(`${nombre} ${color}`) ?? "unisex";
  const tipoFinal = tipo ?? (esRopa ? adivinarTipo(nombre) ?? "" : "");
  const sugeridas = esRopa ? TALLAS_ROPA : categoria === "ZAPATILLAS" ? TALLAS_ZAP : [];
  const opcionesTalla = talla && !sugeridas.includes(talla) ? [...sugeridas, talla] : sugeridas;

  const agregarTalla = () => {
    const t = otraTalla.trim().toUpperCase();
    if (t) setTalla(t);
    setOtraTalla("");
  };

  const reiniciar = () => {
    setFotos([]);
    setNombre("");
    setColor("");
    setGenero(null);
    setTipo(null);
    setTalla("");
    setPrecio("");
    setMinimo("");
    setCosto("");
    setDescripcion("");
    setResultado(null);
    window.scrollTo({ top: 0 });
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await crearPrenda({
        name: nombre,
        color: color || null,
        category: categoria,
        fotos,
        costo_usd: num(costo),
        publicado: publicar,
        precio_venta_bs: num(precio),
        precio_minimo_bs: num(minimo),
        tallas: talla ? [talla] : [],
        disponibilidad: "stock",
        llegada_estimada: null,
        descripcion: descripcion || null,
        genero: generoFinal,
        subcategoria: esRopa ? tipoFinal || null : null,
      });
      setResultado(r.ok ? { ok: true, id: r.id!, publicado: publicar } : r);
    });
  };

  if (resultado?.ok) {
    return (
      <div className="shell shell-form">
        <Sidebar activo="SUBIR PRENDA" />
        <main className="content">
          <div className="empty listo">
            <p className="small muted">PRENDA GUARDADA</p>
            <h3 style={{ fontSize: 40 }}>{resultado.publicado ? "¡Ya está en la tienda!" : "Guardada sin publicar"}</h3>
            <p className="muted">
              {resultado.publicado
                ? "Aparece primero en «Lo nuevo». Puede tardar hasta un minuto en verse."
                : "Está en tu Wishlist; publícala desde su ficha cuando quieras."}
            </p>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={reiniciar}>
                + SUBIR OTRA
              </button>
              {resultado.publicado && (
                <a className="btn" href={`/producto/${resultado.id}`} target="_blank" rel="noreferrer">
                  VER EN LA TIENDA ↗
                </a>
              )}
              <Link className="btn" href="/admin">
                IR A LA WISHLIST
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="shell shell-form">
      <Sidebar activo="SUBIR PRENDA" />
      <main className="content">
        <header className="header">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="small muted">TX-100-02 · CATÁLOGO</p>
            <h2>Subir prenda</h2>
            <p className="muted" style={{ fontSize: 12 }}>
              FOTOS DESDE TU CELULAR · SIN LINK DE TIENDA
            </p>
          </div>
        </header>

        <form className="form subir" onSubmit={enviar}>
          <section className="subir-bloque">
            <h4>Fotos</h4>
            <SubidorFotos fotos={fotos} onChange={setFotos} />
          </section>

          <section className="subir-bloque">
            <h4>Prenda</h4>
            <label className="field">
              <span>NOMBRE</span>
              <input type="text" required maxLength={160} value={nombre} placeholder="Ej. Hoodie Champion Reverse Weave" onChange={(e) => setNombre(e.target.value)} />
            </label>
            <div className="form-grid">
              <label className="field">
                <span>COLOR</span>
                <input type="text" maxLength={60} value={color} placeholder="Ej. Negro" onChange={(e) => setColor(e.target.value)} />
              </label>
              <label className="field">
                <span>CATEGORÍA</span>
                <select
                  value={categoria}
                  onChange={(e) => {
                    setCategoria(e.target.value);
                    setTalla("");
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>DEPARTAMENTO{genero ? "" : " · SUGERIDO"}</span>
                <select value={generoFinal} onChange={(e) => setGenero(e.target.value as Genero)}>
                  <option value="unisex">UNISEX (MUJER Y HOMBRE)</option>
                  <option value="mujer">MUJER</option>
                  <option value="hombre">HOMBRE</option>
                </select>
              </label>
              {esRopa ? (
                <label className="field">
                  <span>TIPO DE PRENDA{tipo === null && tipoFinal ? " · SUGERIDO" : ""}</span>
                  <select value={tipoFinal} onChange={(e) => setTipo(e.target.value)}>
                    <option value="">SIN DEFINIR</option>
                    {TIPOS_ROPA.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div />
              )}
            </div>

            <fieldset className="tallas">
              <legend className="label">TALLA · PIEZA ÚNICA {talla ? `· ${talla}` : ""}</legend>
              {opcionesTalla.length > 0 && (
                <div className="tallas-lista">
                  {opcionesTalla.map((t) => (
                    <button key={t} type="button" className="talla" aria-pressed={talla === t} onClick={() => setTalla(talla === t ? "" : t)}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="tag-input"
                  type="text"
                  value={otraTalla}
                  placeholder={esRopa ? "Otra talla (ej. 32x30)" : "Talla (ej. 8.5, ESTÁNDAR)"}
                  aria-label="Agregar otra talla"
                  onChange={(e) => setOtraTalla(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarTalla();
                    }
                  }}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button type="button" className="btn btn-outline" onClick={agregarTalla} disabled={!otraTalla.trim()}>
                  USAR
                </button>
              </div>
            </fieldset>

            <label className="field">
              <span>DESCRIPCIÓN PARA EL CLIENTE</span>
              <textarea rows={3} maxLength={1500} value={descripcion} placeholder="Opcional: material, cómo talla, estado, original con etiqueta…" onChange={(e) => setDescripcion(e.target.value)} />
            </label>
          </section>

          <section className="subir-bloque">
            <h4>Precio y entrega</h4>
            <div className="form-grid">
              <label className="field">
                <span>PRECIO DE VENTA (Bs)</span>
                <input type="number" inputMode="decimal" min="0" step="1" value={precio} onChange={(e) => setPrecio(e.target.value)} />
              </label>
              <label className="field">
                <span>PRECIO MÍNIMO (Bs) · SOLO TÚ</span>
                <input type="number" inputMode="decimal" min="0" step="1" value={minimo} onChange={(e) => setMinimo(e.target.value)} />
              </label>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>LO QUE TE COSTÓ (USD) · SOLO TÚ</span>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={costo} placeholder="Opcional" onChange={(e) => setCosto(e.target.value)} />
              </label>
              <div />
            </div>
          </section>

          <div className="subir-final">
            <label className="switch">
              <input type="checkbox" checked={publicar} onChange={(e) => setPublicar(e.target.checked)} />
              <span className="switch-ui" aria-hidden="true" />
              <span className="small">{publicar ? "PUBLICAR YA EN LA TIENDA" : "GUARDAR SIN PUBLICAR"}</span>
            </label>
            <button type="submit" className="btn btn-primary" disabled={guardando || fotos.length === 0 || !nombre.trim()}>
              {guardando ? "GUARDANDO…" : publicar ? "SUBIR A LA TIENDA" : "GUARDAR"}
            </button>
            {fotos.length === 0 && <p className="small muted">Sube al menos una foto.</p>}
            {resultado && !resultado.ok && <p className="error">{resultado.error}</p>}
          </div>
        </form>
      </main>
    </div>
  );
}
