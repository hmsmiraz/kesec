import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained .next/standalone build (only the
  // files actually needed at runtime) - much smaller Docker images than
  // shipping the full node_modules tree.
  output: "standalone",
};

export default nextConfig;
