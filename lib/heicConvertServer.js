async function loadConvert() {
  const mod = await import("heic-convert");
  return mod.default || mod;
}

async function loadSharp() {
  const mod = await import("sharp");
  return mod.default || mod;
}

const HEIC_BRANDS = new Set(["heic", "heif", "heim", "heis", "heix", "hevc", "hevx", "mif1", "msf1"]);

export function looksLikeHeic(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

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

  const head = buffer.toString("latin1", 0, Math.min(buffer.length, 128));
  if (!head.includes("ftyp")) {
    return false;
  }
  const lower = head.toLowerCase();
  return [...HEIC_BRANDS].some((entry) => lower.includes(entry));
}

export function looksLikeJpeg(buffer) {
  return Boolean(buffer?.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff);
}

export function looksLikePng(buffer) {
  return Boolean(
    buffer?.length >= 4 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47,
  );
}

export function looksLikeGif(buffer) {
  return Boolean(buffer?.length >= 3 && buffer.toString("ascii", 0, 3) === "GIF");
}

export function looksLikeWebp(buffer) {
  return Boolean(
    buffer?.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
  );
}

export function looksLikeSupportedImage(buffer) {
  return (
    looksLikeJpeg(buffer) || looksLikePng(buffer) || looksLikeGif(buffer) || looksLikeWebp(buffer)
  );
}

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
  if (!looksLikeJpeg(jpeg)) {
    throw new Error("HEIC conversion produced an invalid JPEG.");
  }

  return jpeg;
}

async function rasterizeToJpeg(buffer, { maxEdge = 2560, quality = 85 } = {}) {
  const sharp = await loadSharp();
  // failOn:none — tolerate truncated/odd camera JPEGs; still force browser-safe sRGB baseline JPEG.
  const jpeg = await sharp(buffer, { failOn: "none", unlimited: true })
    .rotate() // honor EXIF orientation
    .toColorspace("srgb")
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality,
      mozjpeg: true,
      force: true,
      progressive: false,
    })
    .toBuffer();

  if (!looksLikeJpeg(jpeg)) {
    throw new Error("Image processing produced an invalid JPEG.");
  }

  return jpeg;
}

/**
 * Normalize any uploaded image to a browser-safe baseline JPEG.
 * - HEIC/HEIF → JPEG via libheif
 * - JPEG/PNG/WebP/GIF (and other sharp-readable formats) → re-encoded JPEG
 *   so EXIF orientation, progressive JPEG, and odd color profiles don't break display
 */
export async function normalizeUploadBuffer(buffer, { type = "", name = "" } = {}) {
  const input = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const typeLower = String(type).toLowerCase();
  const nameLower = String(name).toLowerCase();

  const markedHeic =
    looksLikeHeic(input) ||
    typeLower.includes("heic") ||
    typeLower.includes("heif") ||
    nameLower.endsWith(".heic") ||
    nameLower.endsWith(".heif");

  let working = input;
  let sourceFormat = "image";
  let converted = false;

  if (markedHeic) {
    working = await convertHeicBufferToJpeg(input, 0.92);
    sourceFormat = "heic";
    converted = true;
  } else if (looksLikeJpeg(input)) {
    sourceFormat = "jpg";
  } else if (looksLikePng(input)) {
    sourceFormat = "png";
  } else if (looksLikeGif(input)) {
    sourceFormat = "gif";
  } else if (looksLikeWebp(input)) {
    sourceFormat = "webp";
  } else {
    // Unknown bytes — try HEIC family first, then sharp.
    try {
      working = await convertHeicBufferToJpeg(input, 0.92);
      sourceFormat = "heic";
      converted = true;
    } catch {
      sourceFormat = "unknown";
    }
  }

  try {
    const jpeg = await rasterizeToJpeg(working);
    return {
      buffer: jpeg,
      extension: ".jpg",
      converted: converted || !looksLikeJpeg(input) || jpeg.length !== input.length,
      sourceFormat,
    };
  } catch (error) {
    // If sharp failed on an already-valid JPEG, keep the original rather than reject.
    if (looksLikeJpeg(working)) {
      return {
        buffer: working,
        extension: ".jpg",
        converted,
        sourceFormat,
      };
    }

    throw new Error(
      error?.message ||
        "Unsupported or damaged image. Please upload a JPEG, PNG, WebP, GIF, or HEIC photo.",
    );
  }
}
