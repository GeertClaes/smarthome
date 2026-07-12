import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getDevicePointsRaw, saveDevicePoints } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

function normalizePointPayload(payload, existingId) {
  return {
    id: existingId,
    code: payload.code?.trim() || existingId,
    svg_marker_id: payload.svg_marker_id,
    room_id: payload.room_id,
    label: payload.label?.trim() || payload.code || existingId,
    label_i18n: {
      en: payload.label_i18n?.en?.trim() || payload.label?.trim() || existingId,
      de: payload.label_i18n?.de?.trim() || payload.label?.trim() || existingId,
    },
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

    const point = normalizePointPayload({ ...points[index], ...payload }, id);
    points[index] = point;
    saveDevicePoints(points);
    revalidatePath("/floorplan");

    return jsonOk(point);
  } catch (error) {
    return jsonError(error);
  }
}
