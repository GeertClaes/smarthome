import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getDevicePointsRaw, saveDevicePoints } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

function normalizePointPayload(payload, existingId) {
  const { label, label_i18n, ...rest } = payload;

  return {
    ...rest,
    id: existingId,
    code: payload.code?.trim() || payload.svg_marker_id || existingId,
    svg_marker_id: payload.svg_marker_id,
    room_id: payload.room_id,
    notes: payload.notes?.trim() || "",
    images: Array.isArray(payload.images) ? payload.images : [],
  };
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const point = getDevicePointsRaw().find((entry) => entry.id === id);
    if (!point) {
      return jsonError(new Error("Device point not found."), 404);
    }

    return jsonOk(point);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    assertAdmin(request);
    const { id } = await params;
    const payload = await request.json();
    const points = getDevicePointsRaw();
    const index = points.findIndex((entry) => entry.id === id);

    if (index === -1) {
      if (!payload.svg_marker_id || !payload.room_id) {
        return jsonError(new Error("Device point not found."), 404);
      }

      const point = normalizePointPayload({ ...payload, id }, id);
      points.push(point);
      saveDevicePoints(points);
      revalidatePath("/floorplan");
      return jsonOk(point, { status: 201 });
    }

    const point = normalizePointPayload(
      {
        ...points[index],
        ...payload,
        images: Array.isArray(payload.images) ? payload.images : points[index].images,
      },
      id,
    );
    points[index] = point;
    saveDevicePoints(points);
    revalidatePath("/floorplan");

    return jsonOk(point);
  } catch (error) {
    return jsonError(error);
  }
}
