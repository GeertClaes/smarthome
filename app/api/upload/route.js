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

/** Legacy room ids from older YAML → canonical Building / seed ids */
const LEGACY_ROOM_ID_ALIASES = {
  garden_exterior_not_on_interior_floorplan: "garden",
  car_park_exterior_not_on_interior_floorplan: "car_park",
  back_gate_exterior_not_on_interior_floorplan: "garden",
  back_deck_exterior_not_on_interior_floorplan: "garden",
  exterior_tap_garden_not_on_interior_floorplan: "garden",
};

function resolveRoomId(id) {
  return LEGACY_ROOM_ID_ALIASES[id] ?? id;
}

function getUploadsRoot() {
  // Always under public/ so Next can serve /uploads/...
  // Docker persists this via volume mount on /app/public/uploads.
  return path.join(process.cwd(), "public", "uploads");
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

function findEntityIndex(items, entityType, entityId) {
  const direct = items.findIndex((entry) => entry.id === entityId);
  if (direct !== -1) {
    return direct;
  }

  if (entityType !== "room") {
    return -1;
  }

  // Accept canonical ids even when YAML still has a legacy exterior room id.
  return items.findIndex((entry) => resolveRoomId(entry.id) === entityId);
}

function appendImage(entityType, entityId, url) {
  const { items, save } = getEntityCollection(entityType);
  const index = findEntityIndex(items, entityType, entityId);

  if (index === -1) {
    throw new Error(
      `${entityType} "${entityId}" was not found. Save the record first, then upload photos.`,
    );
  }

  const images = Array.isArray(items[index].images) ? [...items[index].images] : [];
  if (!images.includes(url)) {
    images.push(url);
  }

  const current = items[index];
  const next = { ...current, images };

  // Migrate legacy exterior room rows to canonical Building ids on first photo write.
  if (entityType === "room" && current.id !== entityId && resolveRoomId(current.id) === entityId) {
    next.id = entityId;
    if (entityId === "garden" || entityId === "car_park") {
      next.floor_id = "ground_floor";
    }
  }

  items[index] = next;
  save(items);

  if (entityType === "device_point") {
    revalidatePath("/floorplan");
    revalidatePath("/");
  } else {
    revalidateDocumentationPaths({
      deviceId: entityType === "device" ? entityId : undefined,
      roomId: entityType === "room" ? entityId : undefined,
    });
    revalidatePath("/");
  }

  return images;
}

function removeImage(entityType, entityId, url) {
  const { items, save } = getEntityCollection(entityType);
  const index = findEntityIndex(items, entityType, entityId);

  if (index === -1) {
    throw new Error(
      `${entityType} "${entityId}" was not found. Save the record first, then upload photos.`,
    );
  }

  const images = (items[index].images ?? []).filter((entry) => entry !== url);
  items[index] = { ...items[index], images };
  save(items);

  const relative = url.replace(/^\//, "");
  const candidates = [
    path.join(process.cwd(), "public", relative),
    path.join(getUploadsRoot(), relative.replace(/^uploads\/?/, "")),
  ];

  for (const filePath of candidates) {
    const uploadsRoot = path.resolve(getUploadsRoot());
    const publicUploads = path.resolve(process.cwd(), "public", "uploads");
    if (
      (filePath.startsWith(uploadsRoot) || filePath.startsWith(publicUploads)) &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }
  }

  if (entityType === "device_point") {
    revalidatePath("/floorplan");
    revalidatePath("/");
  } else {
    revalidateDocumentationPaths({
      deviceId: entityType === "device" ? entityId : undefined,
      roomId: entityType === "room" ? entityId : undefined,
    });
    revalidatePath("/");
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

    if (originalBuffer.length < 12) {
      return jsonError(new Error("Photo file is too small or empty."), 400);
    }

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
            "Could not process this photo. Please try another image or export it as JPEG.",
        ),
        400,
      );
    }

    const folder = UPLOAD_FOLDER[entityType];
    const uploadDir = path.join(getUploadsRoot(), folder, entityId);
    fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `${Date.now()}.jpg`;
    const absolutePath = path.join(uploadDir, fileName);
    fs.writeFileSync(absolutePath, normalized.buffer);

    // Confirm the bytes landed — empty/partial writes cause "saved but blank" photos.
    const written = fs.readFileSync(absolutePath);
    if (written.length < 100 || written[0] !== 0xff || written[1] !== 0xd8) {
      try {
        fs.unlinkSync(absolutePath);
      } catch {
        // ignore cleanup errors
      }
      return jsonError(new Error("Photo was written incorrectly. Please try again."), 500);
    }

    // Public URL always under /uploads/... (Docker mounts the uploads root there).
    const url = `/uploads/${folder}/${entityId}/${fileName}`;
    const images = appendImage(entityType, entityId, url);

    return jsonOk(
      {
        url,
        images,
        converted: normalized.converted,
        sourceFormat: normalized.sourceFormat,
        outputFormat: "jpg",
        bytesIn: originalBuffer.length,
        bytesOut: normalized.buffer.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Upload POST failed:", error);
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
