import { getDevicePointLabel } from "@/lib/devicePoints";

export function buildPointLookup(devicePoints = []) {
  return new Map(devicePoints.map((point) => [point.svg_marker_id, point]));
}

export function formatDeviceOptionLabel(device, { roomById = {}, pointByMarker = new Map(), tl }) {
  const room = roomById[device.installed_room_id];
  const roomName = room?.name ?? device.installed_room_id ?? "Unknown room";
  const point = device.floorplan_marker_id ? pointByMarker.get(device.floorplan_marker_id) : null;
  const pointLabel = point ? getDevicePointLabel(point, tl) : device.floorplan_marker_id || "No point";

  return `${device.name} — ${pointLabel} (${roomName})`;
}

export function sortDevicesForPicker(devices = []) {
  return [...devices].toSorted((a, b) => a.name.localeCompare(b.name));
}
