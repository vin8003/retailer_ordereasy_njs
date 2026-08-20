import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Emit route/index.html so GET /dashboard/profile/ is the Profile page.
  // Canonicalize /dashboard/profile → /dashboard/profile/ on hard-refresh
  // so the client router matches this page instead of falling through.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
