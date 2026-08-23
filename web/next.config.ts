import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "https", hostname: "kudya.pythonanywhere.com", pathname: "/**" },
      { protocol: "https", hostname: "mzansi-pi.vercel.app", pathname: "/**" },
    ],
  },
};

export default nextConfig;
