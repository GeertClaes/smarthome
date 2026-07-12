import { revalidateDocumentationPaths } from "@/lib/revalidateDocs";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getRoomsRaw, saveRooms, slugifyId } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

function normalizeRoomPayload(payload, { existingId } = {}) {
  const id = existingId ?? slugifyId(payload.id || payload.name);
  if (!id) {
    throw new Error("Room id or name is required.");
  }

  return {
    id,
    name: payload.name?.trim() || id,
    name_i18n: {
      en: payload.name_i18n?.en?.trim() || payload.name?.trim() || id,
      de: payload.name_i18n?.de?.trim() || payload.name?.trim() || id,
    },
    floor_id: payload.floor_id?.trim() || "ground_floor",
    images: Array.isArray(payload.images) ? payload.images : [],
  };
}

export async function GET() {
  try {
    return jsonOk(getRoomsRaw());
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request) {
  try {
    assertAdmin(request);
    const payload = await request.json();
    const rooms = getRoomsRaw();
    const room = normalizeRoomPayload(payload);

    if (rooms.some((entry) => entry.id === room.id)) {
      return jsonError(new Error("A room with this id already exists."), 409);
    }

    rooms.push(room);
    saveRooms(rooms);
    revalidateDocumentationPaths({ roomId: room.id });

    return jsonOk(room, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
