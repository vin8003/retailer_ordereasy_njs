import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Emit route/index.html so GET /dashboard/profile/ is the Profile page.
  // Canonicalize /dashboard/profile → /dashboard/profile/ on hard-refresh
  // so the client router matches this page instead of falling through.
  trailingSlash: true,
  // Next's built-in trailing-slash 301 drops the query string (typed
  // /dashboard/orders/details?id=2650 would lose ?id=). Serve already
  // returns 200 for the unsashed URL; skip the Next redirect. The head
  // IIFE slash-canonicalizes only when there is no query (profile).
  // Typed ?id= stays on the unsashed path; details pages read
  // window.__OE_SEARCH captured before Next hydrates.
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
