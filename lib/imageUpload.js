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
  "Could not read this photo. On iPad, try “Most Compatible” in Camera settings, or share/export the photo as JPEG and upload that.";

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
      // Fall through to HTMLImageElement — needed for many iPad HEIC library picks.
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

/**
 * Normalize phone/tablet photos before upload.
 * Always re-encodes to JPEG so HEIC (common from iPad Photos) and odd MIME types
 * become something every browser can display.
 */
export async function prepareImageForUpload(file, { maxEdge = 1920, quality = 0.85 } = {}) {
  if (!file) {
    throw new Error("Photo file is required.");
  }

  const type = String(file.type || "").toLowerCase();
  if (type && !type.startsWith("image/") && !isHeicLike(file)) {
    throw new Error("Unsupported file type. Please choose a photo.");
  }

  if (typeof document === "undefined") {
    if (isHeicLike(file)) {
      throw new Error(DECODE_ERROR);
    }
    return file;
  }

  let drawable;
  try {
    drawable = await loadDrawable(file);
  } catch (error) {
    throw error instanceof Error ? error : new Error(DECODE_ERROR);
  }

  try {
    if (!drawable.width || !drawable.height) {
      throw new Error(DECODE_ERROR);
    }

    const scale = Math.min(1, maxEdge / Math.max(drawable.width, drawable.height));
    const width = Math.max(1, Math.round(drawable.width * scale));
    const height = Math.max(1, Math.round(drawable.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(DECODE_ERROR);
    }

    // White background so transparent PNGs don't become black JPEG voids.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    drawable.draw(context, width, height);

    return await canvasToJpegFile(canvas, `${baseNameForFile(file)}.jpg`, quality);
  } finally {
    drawable.close();
  }
}
