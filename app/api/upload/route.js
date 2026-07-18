import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { revalidateDocumentationPaths } from "@/lib/revalidateDocs";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import {
  convertHeicBufferToJpeg,
  looksLikeHeic,
  looksLikeSupportedImage,
} from "@/lib/heicConvertServer";
import {
  getDevicePointsRaw,
  getDevicesRaw,
  getRoomsRaw,
  saveDevicePoints,
  saveDevices,
  saveRooms,
} from "@/lib/dataStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_ENTITY_TYPES = new Set(["device", "room", "device_point"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
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

const UPLOAD_FOLDER = {
  device: "devices",
  room: "rooms",
  device_point: "device-points",
};

function resolveImageExtension(file) {
  const mimeExtension = MIME_EXTENSIONS[String(file.type || "").toLowerCase()];
  if (mimeExtension) {
    return mimeExtension;
  }

  const fromName = path.extname(String(file.name || "")).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(fromName) || fromName === ".heic" || fromName === ".heif") {
    return fromName;
  }

  return "";
}

function extensionForBuffer(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return ".jpg";
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return ".png";
  }
  if (buffer.toString("ascii", 0, 3) === "GIF") {
    return ".gif";
  }
  if (buffer.toString("ascii", 8, 12) === "WEBP") {
    return ".webp";
  }
  return "";
}

function getEntityCollection(entityType) {
  if (entityType === "device") {
    return { items: getDevicesRaw(), save: saveDevices };
  }

  if (entityType === "room") {
    return { items: getRoomsRaw(), save: saveRooms };
  }

  if (entityType === "device_point") {
    return { items: getDevicePointsRaw(), save: saveDevicePoints };
  }

  throw new Error("Unsupported entity type.");
}

function appendImage(entityType, entityId, url) {
  const { items, save } = getEntityCollection(entityType);
  const index = items.findIndex((entry) => entry.id === entityId);

    if (index === -1) {
      throw new Error(`${entityType} "${entityId}" was not found. Save the record first, then upload photos.`);
    }

  const images = Array.isArray(items[index].images) ? [...items[index].images] : [];
  if (!images.includes(url)) {
    images.push(url);
  }

  items[index] = { ...items[index], images };
  save(items);

  if (entityType === "device_point") {
    revalidatePath("/floorplan");
  } else {
    revalidateDocumentationPaths({
      deviceId: entityType === "device" ? entityId : undefined,
      roomId: entityType === "room" ? entityId : undefined,
    });
  }

  return images;
}

function removeImage(entityType, entityId, url) {
  const { items, save } = getEntityCollection(entityType);
  const index = items.findIndex((entry) => entry.id === entityId);

    if (index === -1) {
      throw new Error(`${entityType} "${entityId}" was not found. Save the record first, then upload photos.`);
    }

  const images = (items[index].images ?? []).filter((entry) => entry !== url);
  items[index] = { ...items[index], images };
  save(items);

  const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  if (filePath.startsWith(path.join(process.cwd(), "public", "uploads")) && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  if (entityType === "device_point") {
    revalidatePath("/floorplan");
  } else {
    revalidateDocumentationPaths({
      deviceId: entityType === "device" ? entityId : undefined,
      roomId: entityType === "room" ? entityId : undefined,
    });
  }

  return images;
}

export async function POST(request) {
  try {
    assertAdmin(request);
    const formData = await request.formData();
    const file = formData.get("file");
    const entityType = String(formData.get("entityType") ?? "");
    const entityId = String(formData.get("entityId") ?? "");

    if (!ALLOWED_ENTITY_TYPES.has(entityType)) {
      return jsonError(new Error("Invalid entity type."), 400);
    }

    if (!entityId) {
      return jsonError(new Error("Entity id is required."), 400);
    }

    if (!(file instanceof Blob) || file.size === 0) {
      return jsonError(new Error("Photo file is required."), 400);
    }

    const type = String(file.type || "").toLowerCase();
    const name = String(file.name || "").toLowerCase();
    let buffer = Buffer.from(await file.arrayBuffer());

    const markedHeic =
      type.includes("heic") ||
      type.includes("heif") ||
      name.endsWith(".heic") ||
      name.endsWith(".heif") ||
      looksLikeHeic(buffer);

    if (markedHeic) {
      try {
        buffer = await convertHeicBufferToJpeg(buffer, 0.9);
      } catch (conversionError) {
        console.error("HEIC conversion failed:", conversionError);
        return jsonError(
          new Error(
            "Could not convert this HEIC photo to JPEG on the server. Please try another photo, or export it from Photos as JPEG.",
          ),
          400,
        );
      }
    } else if (!looksLikeSupportedImage(buffer) && looksLikeHeic(buffer)) {
      // Defensive second pass if MIME/extension lied.
      try {
        buffer = await convertHeicBufferToJpeg(buffer, 0.9);
      } catch (conversionError) {
        console.error("HEIC conversion failed:", conversionError);
        return jsonError(
          new Error("Could not convert this photo to JPEG. Please export it from Photos as JPEG."),
          400,
        );
      }
    }

    if (!looksLikeSupportedImage(buffer)) {
      return jsonError(
        new Error("Unsupported or damaged image. Please upload a JPEG, PNG, WebP, GIF, or HEIC photo."),
        400,
      );
    }

    let extension = extensionForBuffer(buffer) || resolveImageExtension(file);
    if (extension === ".heic" || extension === ".heif" || !ALLOWED_EXTENSIONS.has(extension)) {
      extension = ".jpg";
    }

    const folder = UPLOAD_FOLDER[entityType];
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder, entityId);
    fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `${Date.now()}${extension === ".jpeg" ? ".jpg" : extension}`;
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);

    const url = `/uploads/${folder}/${entityId}/${fileName}`;
    const images = appendImage(entityType, entityId, url);

    return jsonOk({ url, images }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request) {
  try {
    assertAdmin(request);
    const { searchParams } = new URL(request.url);
    const entityType = String(searchParams.get("entityType") ?? "");
    const entityId = String(searchParams.get("entityId") ?? "");
    const url = String(searchParams.get("url") ?? "");

    if (!ALLOWED_ENTITY_TYPES.has(entityType) || !entityId || !url) {
      return jsonError(new Error("entityType, entityId, and url are required."), 400);
    }

    const images = removeImage(entityType, entityId, url);
    return jsonOk({ images });
  } catch (error) {
    return jsonError(error);
  }
}
