const DEVICE_MARKER_OVERRIDES = {
  plug_washingmachine: "la_re",
};

const CURRENT_NAME_MARKER_OVERRIDES = {
  ShutterCarPark: "ld_cp",
  GlobeLounge: "ld_lo",
  GlobeTable: "ld_ta",
  SwitchTap: "ld_si",
  SwitchLEDKitchen: "ls_wa",
  SwitchKitchen: "ls_wa",
  LEDTVStrip: "ld_tv",
  RelayTableAndLounge: "ld_re",
  ShutterGarden: "ld_ga",
  ShutterBackDeck: "ld_ba",
  ShutterBackGate: "ld_ga",
  ShutterKitchen: "ld_ki",
  ShutterKitchenBench: "ld_kb",
  ShutterLaundry: "la_cp",
  RelayLaundryAndFridge: "la_re",
  ShutterBedroomSide: "of_cp",
  ShutterBedroomFront: "of_fd",
  ShutterOffice: "mb_ga",
  ShutterBedroom: "br_ga",
  SwitchMasterBedroom: "of_sw",
  SwitchOffice: "mb_sw",
  RelayBathroomHeaterAndMirror: "ba_re",
  RelayBathroomHeaterAndMirrorL: "ba_re",
  ShutterBathroom: "ba_fd",
  SwitchStorage: "st_sw",
  DimmerSwitchHallway: "ha_sw",
  DishWasherPlug: "ld_kb",
  PlugLamp: "ld_la",
  PowerWashingMachine: "la_re",
  FritzRepeater: "ld_nw_rp",
  LittleJerry: "ha_nw_nw",
  FRITZBox: "ha_nw_nw",
  kelder: "of_nw_sv",
};

export function getDeviceMarkerId(device) {
  if (device.floorplan_marker_id) {
    return device.floorplan_marker_id;
  }

  if (DEVICE_MARKER_OVERRIDES[device.id]) {
    return DEVICE_MARKER_OVERRIDES[device.id];
  }

  const currentName = String(device.current_name || "").replace(/[^a-zA-Z0-9]/g, "");
  if (currentName && CURRENT_NAME_MARKER_OVERRIDES[currentName]) {
    return CURRENT_NAME_MARKER_OVERRIDES[currentName];
  }

  if (currentName && !currentName.toLowerCase().includes("notatracked")) {
    return currentName;
  }

  return String(device.name || "").replace(/[^a-zA-Z0-9]/g, "");
}

export function getRoomDeviceGroupId(roomSvgId) {
  if (roomSvgId.startsWith("room_")) {
    return roomSvgId.replace(/^room_/, "points_");
  }

  if (roomSvgId === "Storage" || roomSvgId === "room_st") {
    return "points_st";
  }

  return `points_${roomSvgId}`;
}

export function groupDevicesByMarker(devices) {
  return devices.reduce((map, device) => {
    const markerId = getDeviceMarkerId(device);
    if (!markerId) {
      return map;
    }

    if (!map[markerId]) {
      map[markerId] = [];
    }

    map[markerId].push(device);
    return map;
  }, {});
}

export function parseRoomMarkerIds(svgMarkup, roomSvgId) {
  if (!svgMarkup || !roomSvgId) {
    return [];
  }

  const groupId = getRoomDeviceGroupId(roomSvgId);
  const escapedGroupId = groupId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const groupMatch = svgMarkup.match(
    new RegExp(`<g\\s+id="${escapedGroupId}"[^>]*>([\\s\\S]*?)</g>`, "i"),
  );

  if (!groupMatch) {
    return [];
  }

  const markerIds = [];
  const tagRegex = /<(?:circle|rect|ellipse|path|g)\b[^>]*\bid="([^"]+)"/gi;
  let match = tagRegex.exec(groupMatch[1]);

  while (match) {
    markerIds.push(match[1]);
    match = tagRegex.exec(groupMatch[1]);
  }

  return markerIds;
}

export function getEmptyMarkerIds(markerIds, devicesByMarker) {
  return markerIds.filter((markerId) => !(devicesByMarker[markerId]?.length));
}

export function getMarkerIdForDevice(device) {
  return getDeviceMarkerId(device);
}
