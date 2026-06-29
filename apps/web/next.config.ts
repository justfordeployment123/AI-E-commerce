import type { NextConfig } from "next";

// Next.js image optimization proxy refuses to fetch from private/loopback IPs
// (SSRF guard). When storage is on localhost we set unoptimized=true so the
// browser fetches presigned MinIO URLs directly — MinIO CORS allows it.
// In production set GARAGE_PUBLIC_URL to a real hostname and optimization
// re-enables automatically.
const storageIsLocal =
  !process.env.GARAGE_PUBLIC_URL ||
  /localhost|127\.0\.0\.1/.test(process.env.GARAGE_PUBLIC_URL);

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  images: {
    unoptimized: storageIsLocal,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "http",  hostname: "**" },
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
