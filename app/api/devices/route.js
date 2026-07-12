import { revalidateDocumentationPaths } from "@/lib/revalidateDocs";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getDevicesRaw, saveDevices, slugifyId } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

function normalizeDevicePayload(payload, { existingId } = {}) {
  const id = existingId ?? slugifyId(payload.id || payload.name);
  if (!id) {
    throw new Error("Device id or name is required.");
  }

  return {
    id,
    name: payload.name?.trim() || id,
    current_name: payload.current_name?.trim() || "",
    mac: payload.mac?.trim() || "",
    ip: payload.ip?.trim() || "",
    model: payload.model?.trim() || "",
    device_type: payload.device_type?.trim() || "Other",
    connects_via: payload.connects_via?.trim() || "",
    status: payload.status?.trim() || "Unknown",
    installed_location: payload.installed_location?.trim() || "",
    installed_room_id: payload.installed_room_id?.trim() || "",
    notes: payload.notes?.trim() || "",
    floorplan_marker_id: payload.floorplan_marker_id?.trim() || undefined,
    floorplan_position: payload.floorplan_position || undefined,
    images: Array.isArray(payload.images) ? payload.images : [],
  };
}

export async function GET() {
  try {
    return jsonOk(getDevicesRaw());
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request) {
  try {
    assertAdmin(request);
    const payload = await request.json();
    const devices = getDevicesRaw();
    const device = normalizeDevicePayload(payload);

    if (devices.some((entry) => entry.id === device.id)) {
      return jsonError(new Error("A device with this id already exists."), 409);
    }

    devices.push(device);
    saveDevices(devices);
    revalidateDocumentationPaths({ deviceId: device.id, roomId: device.installed_room_id });

    return jsonOk(device, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
