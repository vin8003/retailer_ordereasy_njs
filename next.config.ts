import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Emit route/index.html so GET /dashboard/profile/ is the Profile page.
  // Canonicalize /dashboard/profile → /dashboard/profile/ on hard-refresh
  // so the client router matches this page instead of falling through.
  trailingSlash: true,
  // Next's built-in trailing-slash 301 drops the query string (typed
  // /dashboard/orders/details?id=2650 would lose ?id=). Serve already
  // returns 200 for the unsashed URL; skip the Next redirect and let
  // the dashboard layout canonicalize via window.location.replace so
  // search/hash stay on the URL.
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
