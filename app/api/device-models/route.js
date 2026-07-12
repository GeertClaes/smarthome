import { revalidateDocumentationPaths } from "@/lib/revalidateDocs";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getDeviceModelsRaw, saveDeviceModels, slugifyId } from "@/lib/dataStore";
import { sortDeviceModels } from "@/lib/deviceModels";

export const dynamic = "force-dynamic";

function normalizeDeviceModelPayload(payload, { existingId, sortOrder } = {}) {
  const id = existingId ?? slugifyId(payload.id || payload.name);
  if (!id) {
    throw new Error("Model id or name is required.");
  }

  return {
    id,
    name: payload.name?.trim() || id,
    manufacturer: payload.manufacturer?.trim() || "",
    device_type: payload.device_type?.trim() || "",
    manual_url: payload.manual_url?.trim() || "",
    notes: payload.notes?.trim() || "",
    color: payload.color?.trim() || "",
    sort_order: typeof sortOrder === "number" ? sortOrder : Number(payload.sort_order) || 0,
  };
}

export async function GET() {
  try {
    return jsonOk(sortDeviceModels(getDeviceModelsRaw()));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request) {
  try {
    assertAdmin(request);
    const payload = await request.json();
    const models = sortDeviceModels(getDeviceModelsRaw());
    const nextSortOrder = models.length ? Math.max(...models.map((entry) => entry.sort_order ?? 0)) + 1 : 1;
    const model = normalizeDeviceModelPayload(payload, { sortOrder: nextSortOrder });

    if (models.some((entry) => entry.id === model.id)) {
      return jsonError(new Error("A model with this id already exists."), 409);
    }

    models.push(model);
    saveDeviceModels(models);
    revalidateDocumentationPaths();

    return jsonOk(model, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request) {
  try {
    assertAdmin(request);
    const payload = await request.json();
    const order = Array.isArray(payload.order) ? payload.order : null;

    if (!order?.length) {
      return jsonError(new Error("order array is required."), 400);
    }

    const models = getDeviceModelsRaw();
    const byId = Object.fromEntries(models.map((entry) => [entry.id, entry]));
    const reordered = order
      .map((id, index) => {
        const entry = byId[id];
        if (!entry) {
          return null;
        }

        return { ...entry, sort_order: index + 1 };
      })
      .filter(Boolean);

    if (reordered.length !== order.length) {
      return jsonError(new Error("One or more model ids were not found."), 400);
    }

    const untouched = models.filter((entry) => !order.includes(entry.id));
    saveDeviceModels(sortDeviceModels([...reordered, ...untouched]));
    revalidateDocumentationPaths();

    return jsonOk(sortDeviceModels(getDeviceModelsRaw()));
  } catch (error) {
    return jsonError(error);
  }
}
