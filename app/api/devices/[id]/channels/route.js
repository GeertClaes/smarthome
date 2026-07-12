import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getChannelsRaw, getDevicesRaw, saveChannels } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

function normalizeChannel(payload, deviceId, fallbackRoomId, index) {
  const channelIndex = Number.isFinite(Number(payload.channel_index)) ? Number(payload.channel_index) : index;

  return {
    id: payload.id?.trim() || `ch_${deviceId}_${channelIndex + 1}`,
    device_id: deviceId,
    channel_index: channelIndex,
    controls: payload.controls?.trim() || `Channel ${channelIndex + 1}`,
    room_id: payload.room_id?.trim() || fallbackRoomId,
    type: payload.type?.trim() || "switch",
  };
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const channels = getChannelsRaw().filter((channel) => channel.device_id === id);
    return jsonOk(channels);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    assertAdmin(request);
    const { id } = await params;
    const payload = await request.json();
    const device = getDevicesRaw().find((entry) => entry.id === id);

    if (!device) {
      return jsonError(new Error("Device not found."), 404);
    }

    const incoming = Array.isArray(payload.channels) ? payload.channels : [];
    const normalized = incoming.map((channel, index) =>
      normalizeChannel(channel, id, device.installed_room_id, index),
    );

    const allChannels = getChannelsRaw().filter((channel) => channel.device_id !== id);
    saveChannels([...allChannels, ...normalized]);
    revalidatePath("/floorplan");
    revalidatePath(`/devices/${id}`);

    return jsonOk(normalized);
  } catch (error) {
    return jsonError(error);
  }
}
