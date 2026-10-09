import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración preparada para operar detrás de reverse proxy (Caddy / Nginx) en Hetzner
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
};

export default nextConfig;
