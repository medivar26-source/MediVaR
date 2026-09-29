import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/cohorts",
        destination: "/programs",
        permanent: false,
      },
      {
        source: "/cohorts/program/:id",
        destination: "/programs/:id?tab=cohorts",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
