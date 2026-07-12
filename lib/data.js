import { readYamlFile } from "@/lib/dataStore";

const LEGACY_ROOM_ID_ALIASES = {
  bathroom_bad: "bathroom",
  duschbad_utility_bathroom: "laundry",
  hallway_diele: "hallway",
  home_office_schlafen: "home_office",
  living_dining_wohnen_essen: "living_dining",
  master_bedroom_zimmer_1: "master_bedroom",
  second_bedroom_zimmer_2: "second_bedroom",
  storage_abstell: "storage",
  kitchen_kueche: "living_dining",
  garden_exterior_not_on_interior_floorplan: "living_dining",
  car_park_exterior_not_on_interior_floorplan: "living_dining",
  back_gate_exterior_not_on_interior_floorplan: "living_dining",
  back_deck_exterior_not_on_interior_floorplan: "living_dining",
  exterior_tap_garden_not_on_interior_floorplan: "living_dining",
  lamp_location: "living_dining",
  cabinet: "living_dining",
};

function normalizeRoomId(id) {
  return LEGACY_ROOM_ID_ALIASES[id] ?? id;
}

function loadYaml(fileName) {
  return readYamlFile(fileName);
}

export function getData() {
  const floors = loadYaml("floors.yaml");
  const rooms = loadYaml("rooms.yaml");
  const devices = loadYaml("devices.yaml");
  const deviceTypes = loadYaml("device_types.yaml");
  const deviceModels = loadYaml("device_models.yaml");
  const channels = loadYaml("channels.yaml");
  const integrations = loadYaml("integrations.yaml");
  const network = loadYaml("network.yaml");
  const documents = loadYaml("documents.yaml");
  const devicePoints = loadYaml("device_points.yaml");
  const site = loadYaml("site.yaml");

  const roomIds = new Set(rooms.map((room) => room.id));

  const normalizedDevices = devices.map((device) => {
    const nextRoomId = normalizeRoomId(device.installed_room_id);
    if (nextRoomId === device.installed_room_id || !roomIds.has(nextRoomId)) {
      return device;
    }

    return {
      ...device,
      installed_room_id: nextRoomId,
    };
  });

  const normalizedChannels = channels.map((channel) => {
    const nextRoomId = normalizeRoomId(channel.room_id);
    if (nextRoomId === channel.room_id || !roomIds.has(nextRoomId)) {
      return channel;
    }

    return {
      ...channel,
      room_id: nextRoomId,
    };
  });

  return {
    floors,
    rooms,
    devices: normalizedDevices,
    deviceTypes,
    deviceModels,
    channels: normalizedChannels,
    integrations,
    network,
    documents,
    devicePoints,
    site,
  };
}

export function getDeviceById(id) {
  return getData().devices.find((device) => device.id === id);
}

export function getRoomById(id) {
  return getData().rooms.find((room) => room.id === id);
}

export function getFloorById(id) {
  return getData().floors.find((floor) => floor.id === id);
}
