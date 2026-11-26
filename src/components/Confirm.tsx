"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type OpcionesConfirmar = {
  titulo?: string;
  mensaje: string;
  detalle?: string;
  confirmar?: string;
  cancelar?: string;
};

type Pendiente = { o: OpcionesConfirmar; resolver: (v: boolean) => void };

const Contexto = createContext<(o: OpcionesConfirmar) => Promise<boolean>>(async () => false);

/** Reemplazo de window.confirm() con el estilo de la app: `if (await confirmar({...}))` */
export function useConfirm() {
  return useContext(Contexto);
}

const sinMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [salida, setSalida] = useState<"si" | "no" | null>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const confirmarRef = useRef<HTMLButtonElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  const confirmar = useCallback(
    (o: OpcionesConfirmar) =>
      new Promise<boolean>((resolver) => {
        focoAnterior.current = document.activeElement as HTMLElement | null;
        setSalida(null);
        setPendiente({ o, resolver });
      }),
    [],
  );

  const cerrar = useCallback(
    (valor: boolean) => {
      if (!pendiente || salida) return;
      setSalida(valor ? "si" : "no");
      const { resolver } = pendiente;
      setTimeout(
        () => {
          setPendiente(null);
          setSalida(null);
          resolver(valor);
          if (!valor) focoAnterior.current?.focus?.();
        },
        sinMovimiento() ? 0 : 220,
      );
    },
    [pendiente, salida],
  );

  // Al abrir: foco en "Cancelar" (lo seguro) y Esc cancela
  useEffect(() => {
    if (!pendiente) return;
    cancelarRef.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation(); // que no cierre también la ficha de atrás
        cerrar(false);
      } else if (e.key === "Tab") {
        // el foco se queda entre los dos botones
        e.preventDefault();
        const enCancelar = document.activeElement === cancelarRef.current;
        (enCancelar ? confirmarRef.current : cancelarRef.current)?.focus();
      }
    };
    window.addEventListener("keydown", alTeclear, true);
    return () => window.removeEventListener("keydown", alTeclear, true);
  }, [pendiente, cerrar]);

  const o = pendiente?.o;
  const titulo = o?.titulo ?? "¿Eliminar?";

  return (
    <Contexto.Provider value={confirmar}>
      {children}
      {o && (
        <div className={`cf-overlay ${salida ?? ""}`}>
          <button className="cf-scrim" aria-label="Cancelar" tabIndex={-1} onClick={() => cerrar(false)} />
          <div className="cf-box" role="alertdialog" aria-modal="true" aria-labelledby="cf-titulo" aria-describedby="cf-mensaje">
            <p className="cf-kicker">CONFIRMAR</p>
            <h2 id="cf-titulo" className="cf-title">
              {titulo}
            </h2>
            <div className="cf-rule" aria-hidden="true" />
            <p id="cf-mensaje" className="cf-msg">
              {o.mensaje}
            </p>
            {o.detalle && <p className="cf-detail">{o.detalle}</p>}
            <div className="cf-actions">
              <button ref={cancelarRef} type="button" className="btn" onClick={() => cerrar(false)}>
                {o.cancelar ?? "CANCELAR"}
              </button>
              <button ref={confirmarRef} type="button" className="btn btn-primary" onClick={() => cerrar(true)}>
                {o.confirmar ?? "ELIMINAR"}
              </button>
            </div>
            <p className="cf-hint">ESC PARA CANCELAR</p>
          </div>
        </div>
      )}
    </Contexto.Provider>
  );
}
