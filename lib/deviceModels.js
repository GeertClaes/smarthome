export function sortDeviceModels(models = []) {
  return [...models].toSorted((a, b) => {
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (orderDiff !== 0) {
      return orderDiff;
    }

    return a.name.localeCompare(b.name);
  });
}

export function groupDeviceModelsByManufacturer(models = []) {
  const sorted = sortDeviceModels(models);
  const groups = new Map();

  for (const model of sorted) {
    const manufacturer = model.manufacturer?.trim() || "Other";
    if (!groups.has(manufacturer)) {
      groups.set(manufacturer, []);
    }
    groups.get(manufacturer).push(model);
  }

  return [...groups.entries()].toSorted(([a], [b]) => a.localeCompare(b));
}

export function findDeviceModelByName(models, modelName) {
  const normalized = String(modelName || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return (
    models.find((entry) => entry.name.trim().toLowerCase() === normalized) ??
    models.find((entry) => normalized.includes(entry.name.trim().toLowerCase())) ??
    null
  );
}

export function findDeviceModelById(models, id) {
  if (!id) {
    return null;
  }

  return models.find((entry) => entry.id === id) ?? null;
}
