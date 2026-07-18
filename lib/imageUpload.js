const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const HEIC_BRANDS = ["heic", "heif", "mif1", "msf1", "heix"];

export function isHeicLike(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return HEIC_TYPES.has(type) || name.endsWith(".heic") || name.endsWith(".heif");
}

function baseNameForFile(file) {
  return String(file?.name || "photo").replace(/\.[^.]+$/, "") || "photo";
}

async function fileLooksLikeHeic(file) {
  if (isHeicLike(file)) {
    return true;
  }

  try {
    const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    if (header.length < 12) {
      return false;
    }

    // ISO BMFF: bytes 4-8 are "ftyp"
    const ftyp =
      header[4] === 0x66 &&
      header[5] === 0x74 &&
      header[6] === 0x79 &&
      header[7] === 0x70;
    if (!ftyp) {
      return false;
    }

    const brand = String.fromCharCode(header[8], header[9], header[10], header[11]).toLowerCase();
    return HEIC_BRANDS.includes(brand);
  } catch {
    return false;
  }
}

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
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
    throw new Error("Could not read this photo in the browser.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not read this photo in the browser."));
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
          reject(new Error("Could not process photo."));
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
 * Prepare a photo for upload.
 * HEIC is NOT converted in the browser (unreliable on iPad Safari) — the server converts it.
 * Decodable JPEG/PNG/WebP are optionally downscaled for mobile uploads.
 */
export async function prepareImageForUpload(file, { maxEdge = 1920, quality = 0.82 } = {}) {
  if (!file) {
    throw new Error("Photo file is required.");
  }

  if (file.size === 0) {
    throw new Error("The selected photo was empty. Please try another one.");
  }

  const type = String(file.type || "").toLowerCase();
  if (type && !type.startsWith("image/") && !isHeicLike(file)) {
    throw new Error("Unsupported file type. Please choose a photo.");
  }

  const heic = await fileLooksLikeHeic(file);
  if (heic) {
    // Pass through for server-side HEIC → JPEG conversion.
    return new File([file], `${baseNameForFile(file)}.heic`, {
      type: "image/heic",
      lastModified: file.lastModified || Date.now(),
    });
  }

  if (typeof document === "undefined") {
    return file;
  }

  try {
    return await withTimeout(
      downscaleJpegFile(file, { maxEdge, quality }),
      20_000,
      "Photo processing timed out. Uploading the original instead.",
    );
  } catch {
    // Upload original; server will convert if it turns out to be HEIC.
    return file;
  }
}
