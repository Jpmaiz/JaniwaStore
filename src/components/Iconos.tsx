/** Íconos de línea (sin marcas): heredan el color del texto */
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "square" as const, "aria-hidden": true };

export const IconoMenu = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" {...base}>
    <path d="M3 6h16M3 11h16M3 16h16" />
  </svg>
);
export const IconoCerrar = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" {...base}>
    <path d="M3 3l12 12M15 3L3 15" />
  </svg>
);
export const IconoDerecha = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" {...base}>
    <path d="M5 2l5 5-5 5" />
  </svg>
);
export const IconoIzquierda = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" {...base}>
    <path d="M10 2L4 8l6 6" />
  </svg>
);
export const IconoChat = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" {...base}>
    <path d="M3 4h14v9H8l-4 3v-3H3z" />
  </svg>
);
/** Cámara genérica (para el link de Instagram, sin usar su logo) */
export const IconoCamara = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" {...base}>
    <rect x="2.5" y="2.5" width="13" height="13" rx="3.5" />
    <circle cx="9" cy="9" r="3.2" />
    <path d="M13 5h.01" />
  </svg>
);
