import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ConfirmProvider } from "@/components/Confirm";

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

export const metadata: Metadata = {
  title: "Nerdie",
  description: "Wishlist y calculadora de compras USA → Bolivia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${zodiak.variable} ${plexMono.variable} ${pixel.variable}`}>
      <body>
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
