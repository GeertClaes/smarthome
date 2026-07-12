import { revalidateDocumentationPaths } from "@/lib/revalidateDocs";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getFloorsRaw, saveFloors } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

function pickI18n(value, fallback = "") {
  return {
    en: value?.en?.trim() || fallback,
    de: value?.de?.trim() || fallback,
  };
}

function normalizeFloorPayload(payload, existing) {
  const summaryEn = payload.summary_i18n?.en?.trim() || payload.summary?.trim() || existing.summary || "";
  const nameEn = payload.name_i18n?.en?.trim() || payload.name?.trim() || existing.name;

  return {
    ...existing,
    id: existing.id,
    name: payload.name?.trim() || nameEn || existing.name,
    name_i18n: pickI18n(payload.name_i18n, payload.name?.trim() || existing.name),
    summary: summaryEn,
    summary_i18n: pickI18n(payload.summary_i18n, summaryEn),
    overview_hint_i18n: pickI18n(
      payload.overview_hint_i18n,
      payload.overview_hint?.trim() || existing.overview_hint_i18n?.en || "",
    ),
    floorplan_image: existing.floorplan_image,
    floorplan_svg: existing.floorplan_svg,
    map_legend: (payload.map_legend ?? existing.map_legend ?? []).map((item, index) => {
      const previous = existing.map_legend?.[index] ?? {};
      const labelEn = item.label_i18n?.en?.trim() || item.label?.trim() || previous.label || "";

      return {
        ...previous,
        ...item,
        id: item.id || previous.id,
        color: item.color || previous.color,
        stroke: item.stroke || previous.stroke,
        label: labelEn,
        label_i18n: pickI18n(item.label_i18n, labelEn),
      };
    }),
  };
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const floor = getFloorsRaw().find((entry) => entry.id === id);

    if (!floor) {
      return jsonError(new Error("Floor not found."), 404);
    }

    return jsonOk(floor);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    assertAdmin(request);
    const { id } = await params;
    const payload = await request.json();
    const floors = getFloorsRaw();
    const index = floors.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return jsonError(new Error("Floor not found."), 404);
    }

    const floor = normalizeFloorPayload(payload, floors[index]);
    floors[index] = floor;
    saveFloors(floors);
    revalidateDocumentationPaths();

    return jsonOk(floor);
  } catch (error) {
    return jsonError(error);
  }
}
