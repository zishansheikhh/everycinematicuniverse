import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.31.125"],
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
