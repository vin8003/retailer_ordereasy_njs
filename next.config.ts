import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Next 16 export writes route.html AND a sibling route/ RSC dir with no
  // index.html. Static hosts (npx serve -s) then treat GET /route as that
  // empty dir and fall back to root index.html (Overview). Emit
  // route/index.html so a direct URL / refresh paints the real page.
  trailingSlash: true,
  // Keep FCM / history / typed paths without a forced client redirect.
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
