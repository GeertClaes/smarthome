/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  // Keep HEIC libs on disk so libheif WASM resolves at runtime.
  serverExternalPackages: ["heic-convert", "heic-decode", "libheif-js", "jpeg-js", "pngjs"],
};

export default nextConfig;