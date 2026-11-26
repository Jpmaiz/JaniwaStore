/**
 * Efectos "Arcade 8 bits": partículas precalculadas (siempre iguales)
 * con la paleta típica de las máquinas de arcade.
 */

export const COLORES_ARCADE = [
  "#FF2E88", // magenta
  "#00E5FF", // cian
  "#FFE600", // amarillo
  "#39FF14", // verde
  "#FF3B30", // rojo
  "#3D5AFE", // azul
  "#FF9100", // naranja
  "#B04CFF", // violeta
  "#FFFFFF", // blanco
];

/** Duración total de cada efecto (ms) */
export const DURACION = { entrar: 1500, mas1: 1100, explotar: 1450 } as const;
export type Efecto = keyof typeof DURACION;

export type Pixel = { x: number; y: number; dx: number; dy: number; s: number; c: string };

function azar(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const cuadricula = (v: number, paso = 8) => Math.round(v / paso) * paso;

function crear(n: number, semilla: number, distMin: number, distMax: number): Pixel[] {
  const r = azar(semilla);
  return Array.from({ length: n }, () => {
    const ang = r() * Math.PI * 2;
    const dist = distMin + r() * (distMax - distMin);
    const tam = [8, 8, 8, 12, 16][Math.floor(r() * 5)];
    return {
      // punto dentro de la tarjeta (relativo a su centro)
      x: cuadricula((r() - 0.5) * 160),
      y: cuadricula((r() - 0.5) * 220),
      // hacia dónde vuela
      dx: cuadricula(Math.cos(ang) * dist),
      dy: cuadricula(Math.sin(ang) * dist - 24),
      s: tam,
      c: COLORES_ARCADE[Math.floor(r() * COLORES_ARCADE.length)],
    };
  });
}

/** Píxeles que llegan desde afuera y forman la tarjeta */
export const PIXELES_ENTRADA = crear(28, 7, 140, 240);
/** Píxeles de la explosión */
export const PIXELES_EXPLOSION = crear(56, 42, 90, 260);
