import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Allow serving large static files (e.g. PDF eBooks)
  serverExternalPackages: ['pdfjs-dist'],

  // Increase static file serving limits
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  // Turbopack config (Next.js 16 default bundler)
  turbopack: {
    resolveAlias: {
      canvas: { browser: '' },
    },
  },
};

export default nextConfig;
