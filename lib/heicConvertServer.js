async function loadConvert() {
  const mod = await import("heic-convert");
  return mod.default || mod;
}

const HEIC_BRANDS = new Set(["heic", "heif", "heim", "heis", "heix", "hevc", "hevx", "mif1", "msf1"]);

export function looksLikeHeic(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  // Standard ISO BMFF: size(4) + "ftyp"(4) + brand(4)
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (HEIC_BRANDS.has(brand)) {
      return true;
    }
    const compat = buffer.toString("ascii", 8, Math.min(buffer.length, 64)).toLowerCase();
    if ([...HEIC_BRANDS].some((entry) => compat.includes(entry))) {
      return true;
    }
  }

  // Fallback: search early bytes for ftyp + heic-family brand (odd box sizes).
  const head = buffer.toString("latin1", 0, Math.min(buffer.length, 128));
  if (!head.includes("ftyp")) {
    return false;
  }
  const lower = head.toLowerCase();
  return [...HEIC_BRANDS].some((entry) => lower.includes(entry));
}

export function looksLikeSupportedImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }

  if (buffer.toString("ascii", 0, 3) === "GIF") {
    return true;
  }

  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return true;
  }

  return false;
}

/**
 * Convert HEIC/HEIF bytes to JPEG using libheif WASM (via heic-convert).
 * Package is marked serverExternalPackages so the .wasm file loads from node_modules.
 */
export async function convertHeicBufferToJpeg(buffer, quality = 0.9) {
  const convert = await loadConvert();
  const input = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  let output;
  try {
    output = await convert({
      buffer: input,
      format: "JPEG",
      quality,
    });
  } catch (error) {
    const message = error?.message || String(error);
    throw new Error(`HEIC conversion failed: ${message}`);
  }

  const jpeg = Buffer.from(output);
  if (!jpeg.length || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) {
    throw new Error("HEIC conversion produced an invalid JPEG.");
  }

  return jpeg;
}

/**
 * Normalize any uploaded image buffer to a browser-safe format.
 * Returns { buffer, extension, converted, sourceFormat }.
 */
export async function normalizeUploadBuffer(buffer, { type = "", name = "" } = {}) {
  if (looksLikeSupportedImage(buffer)) {
    let extension = ".jpg";
    if (buffer[0] === 0x89) extension = ".png";
    else if (buffer.toString("ascii", 0, 3) === "GIF") extension = ".gif";
    else if (buffer.toString("ascii", 8, 12) === "WEBP") extension = ".webp";

    return {
      buffer,
      extension,
      converted: false,
      sourceFormat: extension.slice(1),
    };
  }

  const markedHeic =
    looksLikeHeic(buffer) ||
    String(type).toLowerCase().includes("heic") ||
    String(type).toLowerCase().includes("heif") ||
    String(name).toLowerCase().endsWith(".heic") ||
    String(name).toLowerCase().endsWith(".heif");

  // Always attempt HEIC decode when the file is not already a web image.
  try {
    const jpeg = await convertHeicBufferToJpeg(buffer, 0.9);
    return {
      buffer: jpeg,
      extension: ".jpg",
      converted: true,
      sourceFormat: markedHeic ? "heic" : "unknown-heic-family",
    };
  } catch (error) {
    if (markedHeic) {
      throw error;
    }
    throw new Error(
      "Unsupported or damaged image. Please upload a JPEG, PNG, WebP, GIF, or HEIC photo.",
    );
  }
}
