import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // las fotos se achican en el navegador antes de subir; esto deja margen
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
