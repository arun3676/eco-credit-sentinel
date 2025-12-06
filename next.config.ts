import type { NextConfig } from "next";

// Explicitly set the Turbopack root so Next.js does not try to use a parent
// directory when multiple lockfiles exist on the machine.
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
