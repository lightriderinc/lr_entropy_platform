import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/settings", destination: "/settings/account", permanent: true },
      { source: "/legal", destination: "/legal/privacy", permanent: true },
    ];
  },
};

export default nextConfig;
