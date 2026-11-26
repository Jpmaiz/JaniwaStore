import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ConfirmProvider } from "@/components/Confirm";
import Radio from "@/components/Radio";
import { BolsaProvider } from "@/components/Bolsa";
import { numeroWhatsApp } from "@/lib/tienda";

const zodiak = localFont({
  src: "../../public/fonts/Zodiak-Variable.woff2",
  weight: "100 900",
  variable: "--font-serif",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "../../public/fonts/IBMPlexMono-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/IBMPlexMono-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/IBMPlexMono-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

const pixel = localFont({
  src: "../../public/fonts/PressStart2P-400.woff2",
  weight: "400",
  variable: "--font-pixel",
  display: "swap",
});

/** Dominio público: SITIO_URL si la defines; en Vercel se detecta solo */
function dominio() {
  const v = process.env.SITIO_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null);
  try {
    return new URL(v ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

const DESCRIPCION = "Ropa, zapatillas y accesorios originales en Cochabamba. Piezas únicas: una sola prenda por talla. Coordina por WhatsApp.";

export const metadata: Metadata = {
  metadataBase: dominio(),
  title: "Janiwa",
  description: DESCRIPCION,
  applicationName: "Janiwa",
  appleWebApp: { title: "Janiwa", statusBarStyle: "black-translucent" },
  openGraph: { siteName: "Janiwa", type: "website", locale: "es_BO", title: "Janiwa", description: DESCRIPCION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Janiwa" }] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#110a06", colorScheme: "dark" };

/** Radio opcional: solo aparece si RADIO_URL es un enlace https válido. */
function datosRadio() {
  const url = process.env.RADIO_URL?.trim();
  if (!url || !url.startsWith("https://")) return null;
  return { url, nombre: process.env.RADIO_NOMBRE?.trim() || "Radio en vivo" };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const radio = datosRadio();
  return (
    <html lang="es" className={`${zodiak.variable} ${plexMono.variable} ${pixel.variable}`}>
      <body>
        <ConfirmProvider>
          <BolsaProvider numero={numeroWhatsApp()}>{children}</BolsaProvider>
        </ConfirmProvider>
        {radio && <Radio url={radio.url} nombre={radio.nombre} />}
      </body>
    </html>
  );
}
