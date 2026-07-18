/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["heic-convert", "libheif-js"],
};

export default nextConfig;
