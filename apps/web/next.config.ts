import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/types", "@workspace/ui"],
}

export default nextConfig
