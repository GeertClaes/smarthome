export function toDeviceTypeKey(type) {
  return String(type || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getDeviceIcon(deviceType) {
  const normalized = String(deviceType || "").toLowerCase();

  if (normalized.includes("shutter")) {
    return "fa-bars";
  }

  if (normalized.includes("relay")) {
    return "fa-plug-circle-bolt";
  }

  if (normalized.includes("dimmer")) {
    return "fa-sun";
  }

  if (normalized.includes("switch")) {
    return "fa-toggle-on";
  }

  if (normalized.includes("plug")) {
    return "fa-plug";
  }

  if (normalized.includes("light") || normalized.includes("globe") || normalized.includes("bulb")) {
    return "fa-lightbulb";
  }

  if (normalized.includes("sensor")) {
    return "fa-tower-broadcast";
  }

  if (normalized.includes("infrastructure") || normalized.includes("camera")) {
    return "fa-server";
  }

  return "fa-microchip";
}

export function isInfrastructureDevice(device) {
  return String(device?.device_type || "").toLowerCase().includes("infrastructure");
}

export function isMapPositionSet(position) {
  if (!position || typeof position.x !== "number" || typeof position.y !== "number") {
    return false;
  }

  return !(position.x === 50 && position.y === 50);
}
