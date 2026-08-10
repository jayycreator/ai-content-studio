import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native binaries out of the bundle so their on-disk paths resolve correctly.
  serverExternalPackages: ["ffmpeg-static", "ffprobe-static"],
};

export default nextConfig;
