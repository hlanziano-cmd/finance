import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable static page generation to avoid Supabase env vars issues during build
  output: 'standalone',
};

export default nextConfig;
