import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
        protocol: "https",
      },
      {
        hostname: "**.ufs.sh",
        pathname: "/f/**",
        protocol: "https",
      },
      {
        hostname: "utfs.io",
        pathname: "/f/**",
        protocol: "https",
      },
    ],
  },
}

export default nextConfig
