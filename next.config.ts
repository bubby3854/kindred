import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin to this project root; we have a stray lockfile at ~/package-lock.json.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
