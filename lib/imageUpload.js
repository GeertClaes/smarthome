const MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);

export function isHeicLike(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return HEIC_TYPES.has(type) || name.endsWith(".heic") || name.endsWith(".heif");
}

export function extensionForImage(file) {
  const fromMime = MIME_EXTENSIONS[String(file?.type || "").toLowerCase()];
  if (fromMime) {
    return fromMime;
  }

  const name = String(file?.name || "");
  const dot = name.lastIndexOf(".");
  if (dot >= 0) {
    return name.slice(dot).toLowerCase();
  }

  return ".jpg";
}

/**
 * Normalize phone photos before upload:
 * - reject HEIC with a clear message (iPhone default)
 * - downscale/compress large JPEG/PNG/WebP for mobile networks
 */
export async function prepareImageForUpload(file, { maxEdge = 1920, quality = 0.82 } = {}) {
  if (!file) {
    throw new Error("Photo file is required.");
  }

  if (isHeicLike(file)) {
    throw new Error(
      "iPhone HEIC photos are not supported. In Camera settings choose “Most Compatible”, or export/share the photo as JPEG.",
    );
  }

  const type = String(file.type || "").toLowerCase();
  if (type && !type.startsWith("image/")) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
  }

  // Small files or GIFs: upload as-is
  if (type === "image/gif" || file.size < 900_000) {
    return file;
  }

  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const outputType = type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("Could not process photo."))),
        outputType,
        quality,
      );
    });

    const extension = outputType === "image/png" ? ".png" : ".jpg";
    const baseName = String(file.name || "photo").replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
