/**
 * Minimal client prep — do not decode/re-encode in Safari.
 * iPad HEIC conversion happens on the server (libheif WASM).
 */
export function isHeicLike(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export async function prepareImageForUpload(file) {
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

  // Return the original File untouched. Renaming/re-wrapping can break iPad blobs.
  return file;
}
