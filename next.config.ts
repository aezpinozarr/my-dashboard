import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ❌ No detengas el build aunque haya errores de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ❌ No detengas el build aunque haya errores de TypeScript
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
};

export default nextConfig;