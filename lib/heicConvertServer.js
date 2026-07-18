import convert from "heic-convert";

export function looksLikeHeic(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  if (buffer.toString("ascii", 4, 8) !== "ftyp") {
    return false;
  }

  // Brand can appear in the first 12 bytes or later in the ftyp box.
  const head = buffer.toString("ascii", 0, Math.min(buffer.length, 64)).toLowerCase();
  return ["heic", "heif", "mif1", "msf1", "heix", "hevc"].some((brand) => head.includes(brand));
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
  const output = await convert({
    buffer,
    format: "JPEG",
    quality,
  });

  return Buffer.from(output);
}
