import { parseRoomMarkerIds } from "@/lib/floorplanMarkers";

function humanizeSvgMarkerId(svgMarkerId) {
  return String(svgMarkerId)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
}

function slugifyMarkerId(svgMarkerId) {
  return String(svgMarkerId)
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

export function getDevicePointById(id, registry) {
  return registry.find((point) => point.id === id) ?? null;
}

export function getDevicePointBySvgMarker(roomId, svgMarkerId, registry) {
  return (
    registry.find((point) => point.room_id === roomId && point.svg_marker_id === svgMarkerId) ?? null
  );
}

export function buildRoomDevicePoints({ roomId, roomSvgId, svgMarkup, registry = [] }) {
  const svgMarkerIds = parseRoomMarkerIds(svgMarkup, roomSvgId);

  return svgMarkerIds.map((svgMarkerId) => {
    const existing = getDevicePointBySvgMarker(roomId, svgMarkerId, registry);
    if (existing) {
      return existing;
    }

    return {
      id: `${roomId}.${slugifyMarkerId(svgMarkerId)}`,
      code: svgMarkerId,
      svg_marker_id: svgMarkerId,
      room_id: roomId,
      label: humanizeSvgMarkerId(svgMarkerId),
      label_i18n: {
        en: humanizeSvgMarkerId(svgMarkerId),
        de: humanizeSvgMarkerId(svgMarkerId),
      },
      images: [],
    };
  });
}

export function isNetworkPoint(point) {
  return point?.kind === "network";
}

export function buildNetworkMarkerIdSet(registry = []) {
  return new Set(registry.filter(isNetworkPoint).map((point) => point.svg_marker_id));
}

export function getDevicePointLabel(point, tl) {
  if (!point) {
    return "";
  }

  return tl(point.label_i18n, point.label ?? point.code ?? point.svg_marker_id);
}

export function groupDevicesByPoint(devices, points) {
  const bySvg = points.reduce((map, point) => {
    map[point.svg_marker_id] = [];
    return map;
  }, {});

  for (const device of devices) {
    const svgMarkerId =
      device.floorplan_marker_id ||
      points.find((point) => point.id === device.device_point_id)?.svg_marker_id;

    if (!svgMarkerId) {
      continue;
    }

    if (!bySvg[svgMarkerId]) {
      bySvg[svgMarkerId] = [];
    }

    bySvg[svgMarkerId].push(device);
  }

  return bySvg;
}
