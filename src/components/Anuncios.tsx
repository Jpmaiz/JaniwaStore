"use client";

import { useState, useTransition } from "react";
import { activarAnuncio, crearAnuncio, eliminarAnuncio } from "@/app/actions";
import type { Anuncio } from "@/lib/types";
import { Banner } from "./Banner";
import { useConfirm } from "./Confirm";
import Sidebar from "./Sidebar";
import SubidorFotos from "./SubidorFotos";

const DESTINOS = [
  ["", "SIN BOTÓN"],
  ["/", "LO NUEVO"],
  ["/mujer", "MUJER"],
  ["/hombre", "HOMBRE"],
  ["/todo", "VER TODO"],
  ["/c/zapatillas", "ZAPATILLAS"],
  ["/c/accesorios", "ACCESORIOS"],
  ["otro", "OTRO LINK…"],
] as const;

export default function Anuncios({ anuncios, error }: { anuncios: Anuncio[]; error: string | null }) {
  const [foto, setFoto] = useState<string[]>([]);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [destino, setDestino] = useState("/");
  const [otro, setOtro] = useState("");
  const [boton, setBoton] = useState("");
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pendiente, startTransition] = useTransition();
  const confirmar = useConfirm();

  const enlace = destino === "otro" ? otro.trim() : destino;
  const textoBoton = boton.trim().toUpperCase() || "VER MÁS";
  const activos = anuncios.filter((a) => a.activo).length;

  const publicar = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await crearAnuncio({ titulo, texto: texto || null, imagen_url: foto[0] ?? "", boton: textoBoton, enlace: enlace || null });
      if (r.ok) {
        setFoto([]);
        setTitulo("");
        setTexto("");
        setBoton("");
        setOtro("");
        setMensaje({ ok: true, texto: "Anuncio publicado en la portada." });
      } else setMensaje({ ok: false, texto: r.error });
    });
  };

  const alternar = (a: Anuncio) => startTransition(async () => void (await activarAnuncio(a.id, !a.activo)));
  const borrar = async (a: Anuncio) => {
    const si = await confirmar({ titulo: "Eliminar anuncio", mensaje: `¿Eliminar «${a.titulo}»?`, detalle: "Se borra también su foto.", confirmar: "ELIMINAR" });
    if (si) startTransition(async () => void (await eliminarAnuncio(a.id)));
  };

  return (
    <div className="shell shell-form">
      <Sidebar activo="ANUNCIOS" />
      <main className="content">
        <header className="header">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="small muted">TX-100-03 · PORTADA</p>
            <h2>Anuncios</h2>
            <p className="muted" style={{ fontSize: 12 }}>
              {String(activos).padStart(2, "0")} EN LA PORTADA · {String(anuncios.length - activos).padStart(2, "0")} PAUSADOS
            </p>
          </div>
        </header>

        {error && (
          <div className="empty">
            <p className="label">NO SE PUDIERON CARGAR LOS ANUNCIOS</p>
            <p className="muted">{error}</p>
          </div>
        )}

        <form className="form subir" onSubmit={publicar}>
          <section className="subir-bloque">
            <h4>Nuevo anuncio</h4>
            <SubidorFotos fotos={foto} onChange={setFoto} max={1} carpeta="anuncios" />
            <label className="field">
              <span>TÍTULO</span>
              <input type="text" required maxLength={80} value={titulo} placeholder="Ej. Llegó el lote de invierno" onChange={(e) => setTitulo(e.target.value)} />
            </label>
            <label className="field">
              <span>TEXTO CORTO</span>
              <input type="text" maxLength={200} value={texto} placeholder="Opcional · Ej. Hoodies y chamarras desde Bs 350" onChange={(e) => setTexto(e.target.value)} />
            </label>
            <div className="form-grid">
              <label className="field">
                <span>EL BOTÓN LLEVA A</span>
                <select value={destino} onChange={(e) => setDestino(e.target.value)}>
                  {DESTINOS.map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              {destino ? (
                <label className="field">
                  <span>TEXTO DEL BOTÓN</span>
                  <input type="text" maxLength={30} value={boton} placeholder="VER MÁS" onChange={(e) => setBoton(e.target.value)} />
                </label>
              ) : (
                <div />
              )}
            </div>
            {destino === "otro" && (
              <label className="field">
                <span>LINK (https://… o /seccion)</span>
                <input type="text" value={otro} placeholder="Ej. /mujer/hoodies" onChange={(e) => setOtro(e.target.value)} />
              </label>
            )}
          </section>

          {foto[0] && titulo.trim() && (
            <section className="subir-bloque">
              <h4>Vista previa</h4>
              <div className="banner-preview">
                <Banner a={{ titulo, texto: texto || null, imagen_url: foto[0], boton: textoBoton, enlace: enlace || null }} />
              </div>
            </section>
          )}

          <div className="subir-final">
            <button type="submit" className="btn btn-primary" disabled={pendiente || !foto[0] || !titulo.trim()}>
              {pendiente ? "PUBLICANDO…" : "PUBLICAR EN LA PORTADA"}
            </button>
            {mensaje && <p className={mensaje.ok ? "notice" : "error"}>{mensaje.texto}</p>}
          </div>
        </form>

        {anuncios.length > 0 && (
          <section className="anuncios-lista" aria-label="Tus anuncios">
            <h4>Tus anuncios</h4>
            {anuncios.map((a) => (
              <div key={a.id} className={`anuncio-fila${a.activo ? "" : " pausado"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imagen_url} alt="" />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <strong>{a.titulo}</strong>
                  <span className="small muted">{a.activo ? "EN LA PORTADA" : "PAUSADO"}{a.enlace ? ` · ${a.enlace}` : ""}</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={a.activo} disabled={pendiente} onChange={() => alternar(a)} aria-label={`Mostrar «${a.titulo}» en la portada`} />
                  <span className="switch-ui" aria-hidden="true" />
                </label>
                <button type="button" className="btn" onClick={() => borrar(a)} disabled={pendiente} aria-label={`Eliminar «${a.titulo}»`}>
                  ✕
                </button>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
