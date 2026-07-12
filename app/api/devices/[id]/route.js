import { revalidateDocumentationPaths } from "@/lib/revalidateDocs";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getChannelsRaw, getDevicesRaw, saveChannels, saveDevices } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

function normalizeDevicePayload(payload, existingId) {
  return {
    id: existingId,
    name: payload.name?.trim() || existingId,
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

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const device = getDevicesRaw().find((entry) => entry.id === id);
    if (!device) {
      return jsonError(new Error("Device not found."), 404);
    }

    return jsonOk(device);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    assertAdmin(request);
    const { id } = await params;
    const payload = await request.json();
    const devices = getDevicesRaw();
    const index = devices.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return jsonError(new Error("Device not found."), 404);
    }

    const device = normalizeDevicePayload(payload, id);
    devices[index] = device;
    saveDevices(devices);
    revalidateDocumentationPaths({ deviceId: id, roomId: device.installed_room_id });

    return jsonOk(device);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    assertAdmin(request);
    const { id } = await params;
    const devices = getDevicesRaw();
    const index = devices.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return jsonError(new Error("Device not found."), 404);
    }

    const [removed] = devices.splice(index, 1);
    saveDevices(devices);
    saveChannels(getChannelsRaw().filter((channel) => channel.device_id !== id));
    revalidateDocumentationPaths({ deviceId: id, roomId: removed.installed_room_id });

    return jsonOk({ deleted: id });
  } catch (error) {
    return jsonError(error);
  }
}
