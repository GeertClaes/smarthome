import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { revalidateDocumentationPaths } from "@/lib/revalidateDocs";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import {
  getDevicePointsRaw,
  getDevicesRaw,
  getRoomsRaw,
  saveDevicePoints,
  saveDevices,
  saveRooms,
} from "@/lib/dataStore";

export const dynamic = "force-dynamic";

const ALLOWED_ENTITY_TYPES = new Set(["device", "room", "device_point"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
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
  if (ALLOWED_EXTENSIONS.has(fromName)) {
    return fromName;
  }

  return "";
}

function looksLikeHeic(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  if (buffer.toString("ascii", 4, 8) !== "ftyp") {
    return false;
  }

  const brand = buffer.toString("ascii", 8, 12).toLowerCase();
  return ["heic", "heif", "mif1", "msf1", "heix", "hevc"].includes(brand);
}

function looksLikeSupportedImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // GIF
  if (buffer.toString("ascii", 0, 3) === "GIF") {
    return true;
  }

  // WebP
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return true;
  }

  return false;
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
    throw new Error(`${entityType} not found.`);
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
    throw new Error(`${entityType} not found.`);
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
    if (type.includes("heic") || type.includes("heif")) {
      return jsonError(
        new Error(
          "HEIC photos must be converted before upload. Please try again — the app converts photos automatically on supported browsers.",
        ),
        400,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (looksLikeHeic(buffer)) {
      return jsonError(
        new Error(
          "This looks like an iPhone/iPad HEIC photo. The browser could not convert it. In Camera settings choose “Most Compatible”, or export the photo as JPEG.",
        ),
        400,
      );
    }

    if (!looksLikeSupportedImage(buffer)) {
      return jsonError(
        new Error("Unsupported or damaged image. Please upload a JPEG, PNG, WebP, or GIF."),
        400,
      );
    }

    let extension = resolveImageExtension(file);
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      extension = ".jpg";
    } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      extension = ".png";
    } else if (buffer.toString("ascii", 0, 3) === "GIF") {
      extension = ".gif";
    } else if (buffer.toString("ascii", 8, 12) === "WEBP") {
      extension = ".webp";
    }

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return jsonError(new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF."), 400);
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
