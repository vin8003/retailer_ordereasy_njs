import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Emit route/index.html so GET /dashboard/profile/ is the Profile page.
  // Client canonicalize lives in src/app/dashboard/layout.tsx — static
  // hosts have no Next 308, so an unsashed /dashboard/profile hard-refresh
  // must router.replace to the slashed path or the App Router falls through.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
