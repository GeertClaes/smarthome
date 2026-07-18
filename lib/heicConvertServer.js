import convert from "heic-convert";

const HEIC_BRANDS = new Set(["heic", "heif", "mif1", "msf1", "heix"]);

export function looksLikeHeic(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  if (buffer.toString("ascii", 4, 8) !== "ftyp") {
    return false;
  }

  const brand = buffer.toString("ascii", 8, 12).toLowerCase();
  if (HEIC_BRANDS.has(brand)) {
    return true;
  }

  // Some files put compatible brands after the major brand.
  const head = buffer.toString("ascii", 8, Math.min(buffer.length, 32)).toLowerCase();
  return [...HEIC_BRANDS].some((entry) => head.includes(entry));
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
 * Convert HEIC/HEIF bytes to JPEG. Throws if conversion fails.
 */
export async function convertHeicBufferToJpeg(buffer, quality = 0.9) {
  let output;
  try {
    output = await convert({
      buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
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
