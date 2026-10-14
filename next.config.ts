import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/settings", destination: "/settings/account", permanent: true },
      // Stripe checkout started here returns to /settings/credits: that URL is
      // set by the cloud platform's /api/internal/entropy/checkout, so keep
      // it working. Query (?checkout=success|canceled) is passed through.
      { source: "/settings/credits", destination: "/settings/manage-credits", permanent: false },
    ];
  },
};

export default nextConfig;
