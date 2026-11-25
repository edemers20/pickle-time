import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["@electric-sql/pglite"],
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "0.0.0.0"],
  experimental: {
    // The persisted dev cache caused an "HMR hash mismatch" reload loop after restarts.
    turbopackFileSystemCacheForDev: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
