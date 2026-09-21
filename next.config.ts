import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/settings", destination: "/settings/account", permanent: true },
    ];
  },
};

export default nextConfig;
