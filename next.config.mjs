/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  // Keep HEIC + sharp on disk so native/WASM binaries resolve at runtime.
  serverExternalPackages: [
    "heic-convert",
    "heic-decode",
    "libheif-js",
    "jpeg-js",
    "pngjs",
    "sharp",
  ],
  async headers() {
    return [
      {
        // Uploaded photos use unique filenames; allow long cache after a successful write.
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;