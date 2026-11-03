import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The framework adds this header to every response; it tells visitors nothing they need.
  poweredByHeader: false,
  // Responses are compressed (gzip) by the Next server; stated here so nobody turns it off by accident.
  compress: true,
  images: {
    // Used by any <Image> added later. Scans are not served through it: the planner measures pixels on the
    // file as stored, so re-encoding a scan would change what is measured.
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        // Case scans are plain files in /public. They are not content-hashed, so a browser may reuse one for
        // five minutes and must then revalidate (a cheap 304 when unchanged); a stale copy is never served as
        // current for long, because a changed scan has to match the calibration stored with its case.
        source: "/scans/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=86400" }],
      },
    ];
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
