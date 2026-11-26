"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const ESCAPADAS = 3; // en PC y celular: se escapa 3 veces y a la tercera se rinde
const BORDE = 56; // espacio libre a cada lado (menú y WhatsApp no se tapan)

type Pos = { x: number; y: number; r: number };
const CASA: Pos = { x: 0, y: 0, r: 0 };

/**
 * Logo de la barra que juega a escaparse.
 * Con teclado, o con "reducir movimiento" activado, funciona siempre como link normal.
 */
export default function LogoEscurridizo() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState<Pos>(CASA);
  const [globo, setGlobo] = useState<string | null>(null);
  const saltos = useRef(0);
  const rendido = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const sinJuego = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esperar = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  const decir = useCallback((texto: string) => {
    setGlobo(texto);
    esperar(1600, () => setGlobo(null));
  }, []);

  /** Un lugar nuevo dentro de la barra, lejos de donde está ahora */
  const saltar = useCallback(() => {
    const a = ref.current;
    const barra = a?.parentElement;
    if (!a || !barra) return;
    const min = BORDE - a.offsetLeft;
    const max = barra.clientWidth - BORDE - a.offsetWidth - a.offsetLeft;
    if (max <= min) return;
    setPos((actual) => {
      let x = actual.x;
      for (let i = 0; i < 12 && Math.abs(x - actual.x) < (max - min) * 0.3; i++) x = min + Math.random() * (max - min);
      return { x, y: (Math.random() - 0.5) * 10, r: (Math.random() - 0.5) * 18 };
    });
  }, []);

  const reiniciar = () => {
    saltos.current = 0;
    rendido.current = false;
  };

  /** Una escapada más; a la tercera se queda quieto y se deja atrapar */
  const escapar = (frase: string) => {
    saltos.current += 1;
    saltar();
    if (saltos.current >= ESCAPADAS) {
      rendido.current = true;
      decir(frase);
    }
  };

  // Computadora: se escapa cuando llega el cursor
  const alAcercarse = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || sinJuego() || rendido.current) return;
    escapar("ya, me rindo");
  };

  // Cuando el cursor se va después de rendirse, vuelve a su lugar y el juego empieza de nuevo
  const alAlejarse = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !rendido.current) return;
    esperar(1400, () => {
      setPos(CASA);
      reiniciar();
    });
  };

  const alTocar = (e: React.MouseEvent) => {
    if (e.detail === 0 || sinJuego()) return; // teclado: siempre funciona
    const tactil = window.matchMedia("(hover: none)").matches;

    if (tactil) {
      // Celular: salta 3 veces; el cuarto toque ya entra
      if (!rendido.current) {
        e.preventDefault();
        escapar("ok, ahora sí");
        return;
      }
      setPos(CASA);
      reiniciar();
      return;
    }

    // Computadora: no se deja hacer clic hasta rendirse
    if (!rendido.current) {
      e.preventDefault();
      escapar("ya, me rindo");
      return;
    }
    reiniciar();
  };

  return (
    <Link
      ref={ref}
      href="/"
      className="bar-logo"
      aria-label="Janiwa, inicio"
      onPointerEnter={alAcercarse}
      onPointerLeave={alAlejarse}
      onClick={alTocar}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.r}deg)` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={233} height={320} />
      <span>Janiwa</span>
      {globo && (
        <span className="logo-globo" aria-hidden="true">
          {globo}
        </span>
      )}
    </Link>
  );
}
