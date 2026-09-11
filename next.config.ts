import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Turbopack confunda la raíz del proyecto con C:\Users\machine
  // (que tiene su propio package.json/lockfile un nivel más arriba).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
