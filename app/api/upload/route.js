import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { revalidateDocumentationPaths } from "@/lib/revalidateDocs";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { normalizeUploadBuffer } from "@/lib/heicConvertServer";
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

const UPLOAD_FOLDER = {
  device: "devices",
  room: "rooms",
  device_point: "device-points",
};

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
    throw new Error(
      `${entityType} "${entityId}" was not found. Save the record first, then upload photos.`,
    );
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
    throw new Error(
      `${entityType} "${entityId}" was not found. Save the record first, then upload photos.`,
    );
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

    const type = String(file.type || "");
    const name = String(file.name || "photo");
    const originalBuffer = Buffer.from(await file.arrayBuffer());

    let normalized;
    try {
      normalized = await normalizeUploadBuffer(originalBuffer, { type, name });
    } catch (conversionError) {
      console.error("Image normalize failed:", {
        type,
        name,
        size: originalBuffer.length,
        error: conversionError,
      });
      return jsonError(
        new Error(
          conversionError?.message ||
            "Could not convert this photo. Please try exporting it from Photos as JPEG.",
        ),
        400,
      );
    }

    const folder = UPLOAD_FOLDER[entityType];
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder, entityId);
    fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `${Date.now()}${normalized.extension}`;
    fs.writeFileSync(path.join(uploadDir, fileName), normalized.buffer);

    const url = `/uploads/${folder}/${entityId}/${fileName}`;
    const images = appendImage(entityType, entityId, url);

    return jsonOk(
      {
        url,
        images,
        converted: normalized.converted,
        sourceFormat: normalized.sourceFormat,
        outputFormat: normalized.extension.slice(1),
        bytesIn: originalBuffer.length,
        bytesOut: normalized.buffer.length,
      },
      { status: 201 },
    );
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
