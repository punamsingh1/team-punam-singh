import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* * Ttteeee Professional Config:
   * We removed the rewrites to port 5000.
   * Now, /api requests will be handled locally by your Next.js API routes.
   */
  reactStrictMode: true,
  trailingSlash: true, // or false
  // You can add other config options here, but keep 'rewrites' empty or removed.
};

export default nextConfig;