import { revalidateDocumentationPaths } from "@/lib/revalidateDocs";
import { assertAdmin } from "@/lib/adminAuth";
import { jsonError, jsonOk } from "@/lib/apiResponse";
import { getDeviceModelsRaw, saveDeviceModels } from "@/lib/dataStore";
import { sortDeviceModels } from "@/lib/deviceModels";

export const dynamic = "force-dynamic";

function normalizeDeviceModelPayload(payload, existingId) {
  return {
    id: existingId,
    name: payload.name?.trim() || existingId,
    manufacturer: payload.manufacturer?.trim() || "",
    device_type: payload.device_type?.trim() || "",
    manual_url: payload.manual_url?.trim() || "",
    notes: payload.notes?.trim() || "",
    color: payload.color?.trim() || "",
    sort_order: Number(payload.sort_order) || 0,
  };
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const model = getDeviceModelsRaw().find((entry) => entry.id === id);
    if (!model) {
      return jsonError(new Error("Device model not found."), 404);
    }

    return jsonOk(model);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    assertAdmin(request);
    const { id } = await params;
    const payload = await request.json();
    const models = getDeviceModelsRaw();
    const index = models.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return jsonError(new Error("Device model not found."), 404);
    }

    const model = normalizeDeviceModelPayload(payload, id);
    models[index] = model;
    saveDeviceModels(sortDeviceModels(models));
    revalidateDocumentationPaths();

    return jsonOk(model);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    assertAdmin(request);
    const { id } = await params;
    const models = getDeviceModelsRaw();
    const index = models.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return jsonError(new Error("Device model not found."), 404);
    }

    models.splice(index, 1);
    saveDeviceModels(sortDeviceModels(models.map((entry, entryIndex) => ({ ...entry, sort_order: entryIndex + 1 }))));
    revalidateDocumentationPaths();

    return jsonOk({ deleted: id });
  } catch (error) {
    return jsonError(error);
  }
}
