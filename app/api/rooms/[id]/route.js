import { revalidateDocumentationPaths } from "@/lib/revalidateDocs";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getRoomsRaw, saveRooms } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

function normalizeRoomPayload(payload, existingId) {
  const room = {
    id: existingId,
    name: payload.name?.trim() || existingId,
    name_i18n: {
      en: payload.name_i18n?.en?.trim() || payload.name?.trim() || existingId,
      de: payload.name_i18n?.de?.trim() || payload.name?.trim() || existingId,
    },
    floor_id: payload.floor_id?.trim() || "ground_floor",
    images: Array.isArray(payload.images) ? payload.images : [],
  };

  if (payload.ownership) {
    room.ownership = String(payload.ownership).trim();
  }

  return room;
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const room = getRoomsRaw().find((entry) => entry.id === id);
    if (!room) {
      return jsonError(new Error("Room not found."), 404);
    }

    return jsonOk(room);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    assertAdmin(request);
    const { id } = await params;
    const payload = await request.json();
    const rooms = getRoomsRaw();
    const index = rooms.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return jsonError(new Error("Room not found."), 404);
    }

    const existing = rooms[index];
    const room = normalizeRoomPayload(
      {
        ...existing,
        ...payload,
        images: Array.isArray(payload.images) ? payload.images : existing.images,
      },
      id,
    );
    rooms[index] = room;
    saveRooms(rooms);
    revalidateDocumentationPaths({ roomId: id });

    return jsonOk(room);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    assertAdmin(request);
    const { id } = await params;
    const rooms = getRoomsRaw();
    const index = rooms.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return jsonError(new Error("Room not found."), 404);
    }

    rooms.splice(index, 1);
    saveRooms(rooms);
    revalidateDocumentationPaths({ roomId: id });

    return jsonOk({ deleted: id });
  } catch (error) {
    return jsonError(error);
  }
}
