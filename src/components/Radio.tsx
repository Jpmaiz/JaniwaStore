"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Estado = "apagada" | "cargando" | "sonando" | "sin-senal";
const REINTENTOS = 2;

/**
 * Radio en vivo de la tienda. Vive en el layout raíz, así que sigue sonando al
 * navegar entre páginas. Nunca arranca sola: solo con el botón de play.
 */
export default function Radio({ url, nombre }: { url: string; nombre: string }) {
  const ruta = usePathname();
  const audio = useRef<HTMLAudioElement | null>(null);
  const intentos = useRef(0);
  const reintento = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [estado, setEstado] = useState<Estado>("apagada");

  const soltar = useCallback(() => {
    if (reintento.current) clearTimeout(reintento.current);
    const a = audio.current;
    if (!a) return;
    a.pause();
    a.removeAttribute("src"); // corta la descarga del stream
    a.load();
  }, []);

  const conectar = useCallback(() => {
    const a = audio.current ?? new Audio();
    audio.current = a;
    a.preload = "none";
    a.onplaying = () => {
      intentos.current = 0;
      setEstado("sonando");
    };
    a.onwaiting = () => setEstado("cargando");
    a.onerror = () => {
      if (!a.getAttribute("src")) return; // error provocado al apagar
      if (intentos.current < REINTENTOS) {
        intentos.current += 1;
        setEstado("cargando");
        reintento.current = setTimeout(conectar, 3000);
      } else {
        soltar();
        setEstado("sin-senal");
      }
    };
    a.src = url; // siempre desde el punto en vivo, no desde donde se pausó
    setEstado("cargando");
    a.play().catch(() => {
      /* el error real lo maneja onerror; si el navegador bloquea, vuelve a apagada */
      if (a.paused && a.error === null) setEstado("apagada");
    });

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: nombre,
        artist: "Janiwa · Radio en vivo",
        artwork: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
      });
    }
  }, [url, nombre, soltar]);

  const alternar = () => {
    if (estado === "sonando" || estado === "cargando") {
      soltar();
      setEstado("apagada");
    } else {
      intentos.current = 0;
      conectar();
    }
  };

  // Controles del sistema (pantalla bloqueada, auriculares)
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => conectar());
    navigator.mediaSession.setActionHandler("pause", () => {
      soltar();
      setEstado("apagada");
    });
    navigator.mediaSession.setActionHandler("stop", () => {
      soltar();
      setEstado("apagada");
    });
  }, [conectar, soltar]);

  useEffect(() => soltar, [soltar]);

  // Fuera de la tienda (panel y login) la radio se apaga y no se muestra
  const privada = ruta.startsWith("/admin") || ruta.startsWith("/login");
  useEffect(() => {
    if (privada) {
      soltar();
      setEstado("apagada");
    }
  }, [privada, soltar]);
  if (privada) return null;

  const activa = estado === "sonando" || estado === "cargando";
  const texto =
    estado === "sonando" ? "EN VIVO" : estado === "cargando" ? "CONECTANDO…" : estado === "sin-senal" ? "SIN SEÑAL · REINTENTAR" : "RADIO";

  return (
    <div className={`radio radio-${estado}`} role="region" aria-label="Radio en vivo">
      <button
        type="button"
        className="radio-btn"
        onClick={alternar}
        aria-pressed={activa}
        aria-label={activa ? `Pausar ${nombre}` : `Escuchar ${nombre}`}
      >
        {activa ? (
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
            <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M4 2 L14 8 L4 14 Z" fill="currentColor" />
          </svg>
        )}
      </button>
      <span className="radio-eq" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <span className="radio-txt">
        <b>{texto}</b>
        <span className="radio-nombre">{nombre}</span>
      </span>
      <span className="sr-only" aria-live="polite">{texto === "RADIO" ? "" : texto}</span>
    </div>
  );
}
