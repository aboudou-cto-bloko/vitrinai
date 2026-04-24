import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Cache statique long pour les assets Next.js
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Pas de cache pour les routes API
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },

  async redirects() {
    return [
      // Redirection www → non-www si domaine configuré
      ...(process.env.NEXT_PUBLIC_SITE_URL?.includes("vitrinai.com")
        ? [
            {
              source: "/(.*)",
              has: [{ type: "host" as const, value: "www.vitrinai.com" }],
              destination: "https://vitrinai.com/:path*",
              permanent: true,
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
