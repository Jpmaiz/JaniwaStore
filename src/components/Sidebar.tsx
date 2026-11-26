"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/types";

const MODULOS = [
  { label: "WISHLIST", no: "01", href: "/" },
  { label: "TIENDAS", no: "02", href: "/tiendas" },
  { label: "LOTES", no: "03" },
  { label: "STOCK", no: "04" },
  { label: "CAPITAL", no: "05" },
  { label: "HISTÓRICO", no: "06" },
];

export default function Sidebar({
  activo,
  categoria,
  conteo,
  onCategoria,
}: {
  activo: "WISHLIST" | "TIENDAS";
  categoria?: string;
  conteo?: Record<string, number>;
  onCategoria?: (c: string) => void;
}) {
  const cats = ["TODO", ...CATEGORIES.filter((c) => (conteo?.[c] ?? 0) > 0 || c === categoria)];
  return (
    <aside className="sidebar">
      <Link href="/" className="lockup" aria-label="Nerdie, ir al inicio">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" />
        <span className="lockup-text">
          <h1 className="lockup-name">Nerdie</h1>
          <span className="lockup-sub">COMPRA / VENTA</span>
        </span>
      </Link>

      {onCategoria && conteo && (
        <nav className="nav" aria-label="Categorías">
          <div className="row-head label">
            <span>CATEGORÍA</span>
            <span>CANT.</span>
          </div>
          {cats.map((c) => {
            const on = c === categoria;
            return (
              <button key={c} className="nav-item row" aria-current={on} onClick={() => onCategoria(c)}>
                <span className="nav-mark">{on ? "▸" : ""}</span>
                <span>{c}</span>
                <span className="leader" aria-hidden="true" />
                <span>{String(conteo[c] ?? 0).padStart(2, "0")}</span>
              </button>
            );
          })}
        </nav>
      )}

      <nav className="nav" aria-label="Módulos">
        <div className="row-head label">
          <span>MÓDULO</span>
          <span>No.</span>
        </div>
        {MODULOS.map((m) => {
          const on = m.label === activo;
          const contenido = (
            <>
              <span className="nav-mark">{on ? "▸" : ""}</span>
              <span>{m.label}</span>
              <span className="leader" aria-hidden="true" />
              <span>{m.no}</span>
            </>
          );
          return m.href ? (
            <Link key={m.label} href={m.href} className="nav-item row" aria-current={on ? "page" : undefined}>
              {contenido}
            </Link>
          ) : (
            <button key={m.label} className="nav-item row" disabled title="Próximamente">
              {contenido}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
