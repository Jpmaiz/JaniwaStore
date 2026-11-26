import type { MetadataRoute } from "next";

/** Datos para "Agregar a pantalla de inicio" en el celular */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Janiwa",
    short_name: "Janiwa",
    description: "Piezas únicas de ropa, zapatillas y accesorios en Cochabamba.",
    start_url: "/",
    display: "standalone",
    background_color: "#110a06",
    theme_color: "#110a06",
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
