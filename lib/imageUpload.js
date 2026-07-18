const MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const DECODE_ERROR =
  "Could not convert this photo. Please try again, or export it from Photos as JPEG.";

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

function baseNameForFile(file) {
  return String(file?.name || "photo").replace(/\.[^.]+$/, "") || "photo";
}

async function fileLooksLikeHeic(file) {
  if (isHeicLike(file)) {
    return true;
  }

  try {
    const header = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    if (header.length < 12) {
      return false;
    }

    const ascii = String.fromCharCode(...header);
    if (!ascii.includes("ftyp")) {
      return false;
    }

    const lower = ascii.toLowerCase();
    return ["heic", "heif", "mif1", "msf1", "heix", "hevc"].some((brand) => lower.includes(brand));
  } catch {
    return false;
  }
}

async function convertHeicWithLibrary(file, quality) {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality,
  });

  const blob = Array.isArray(result) ? result[0] : result;
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error(DECODE_ERROR);
  }

  return new File([blob], `${baseNameForFile(file)}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function loadDrawable(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw(context, width, height) {
          context.drawImage(bitmap, 0, 0, width, height);
        },
        close() {
          bitmap.close();
        },
      };
    } catch {
      // Fall through.
    }
  }

  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new Error(DECODE_ERROR);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error(DECODE_ERROR));
      element.src = objectUrl;
    });

    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      draw(context, width, height) {
        context.drawImage(image, 0, 0, width, height);
      },
      close() {},
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToJpegFile(canvas, fileName, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size === 0) {
          reject(new Error(DECODE_ERROR));
          return;
        }
        resolve(
          new File([blob], fileName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          }),
        );
      },
      "image/jpeg",
      quality,
    );
  });
}

async function downscaleJpegFile(file, { maxEdge, quality }) {
  const drawable = await loadDrawable(file);

  try {
    if (!drawable.width || !drawable.height) {
      return file;
    }

    const scale = Math.min(1, maxEdge / Math.max(drawable.width, drawable.height));
    if (scale >= 0.98 && file.size < 1_500_000) {
      return file;
    }

    const width = Math.max(1, Math.round(drawable.width * scale));
    const height = Math.max(1, Math.round(drawable.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    drawable.draw(context, width, height);
    return await canvasToJpegFile(canvas, `${baseNameForFile(file)}.jpg`, quality);
  } finally {
    drawable.close();
  }
}

/**
 * Normalize phone/tablet photos before upload.
 * HEIC/HEIF (common from iPad Photos) is converted with heic2any → JPEG.
 * Other images are re-encoded/downscaled to JPEG when possible.
 * The server also converts any HEIC that still arrives.
 */
export async function prepareImageForUpload(file, { maxEdge = 1920, quality = 0.85 } = {}) {
  if (!file) {
    throw new Error("Photo file is required.");
  }

  const type = String(file.type || "").toLowerCase();
  if (type && !type.startsWith("image/") && !isHeicLike(file)) {
    throw new Error("Unsupported file type. Please choose a photo.");
  }

  const heic = await fileLooksLikeHeic(file);

  if (heic) {
    try {
      const converted = await convertHeicWithLibrary(file, quality);
      if (typeof document === "undefined") {
        return converted;
      }
      try {
        return await downscaleJpegFile(converted, { maxEdge, quality });
      } catch {
        return converted;
      }
    } catch {
      // Let the server converter handle it if the browser library fails.
      return new File([file], `${baseNameForFile(file)}.heic`, {
        type: file.type || "image/heic",
        lastModified: file.lastModified || Date.now(),
      });
    }
  }

  if (typeof document === "undefined") {
    return file;
  }

  try {
    return await downscaleJpegFile(file, { maxEdge, quality });
  } catch {
    // Last resort: try HEIC converter anyway (iPad sometimes lies about MIME type).
    try {
      const converted = await convertHeicWithLibrary(file, quality);
      return await downscaleJpegFile(converted, { maxEdge, quality });
    } catch {
      throw new Error(DECODE_ERROR);
    }
  }
}
