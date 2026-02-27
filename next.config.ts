import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cl63pwy1.tinifycdn.com",
      },
      {
        protocol: "https",
        hostname: "lezzooeats-uploads.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "lezzooeats-uploads.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "client-images-cdn.xomali.ai",
      },
    ],
  },
};

export default nextConfig;
