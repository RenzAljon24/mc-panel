import type { NextConfig } from "next";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "corecraft.site";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        BASE_DOMAIN,
        `www.${BASE_DOMAIN}`,
        `servers.${BASE_DOMAIN}`,
        `shop.${BASE_DOMAIN}`,
      ],
    },
  },
};

export default nextConfig;
