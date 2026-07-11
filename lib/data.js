import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const DATA_DIR = path.join(process.cwd(), "data");

const LEGACY_ROOM_ID_ALIASES = {
  bathroom_bad: "bathroom",
  duschbad_utility_bathroom: "laundry",
  hallway_diele: "hallway",
  home_office_schlafen: "home_office",
  living_dining_wohnen_essen: "living_dining",
  master_bedroom_zimmer_1: "master_bedroom",
  second_bedroom_zimmer_2: "second_bedroom",
  storage_abstell: "storage",
};

function normalizeRoomId(id) {
  return LEGACY_ROOM_ID_ALIASES[id] ?? id;
}

function loadYaml(fileName) {
  const fullPath = path.join(DATA_DIR, fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  return yaml.load(fileContents);
}

export function getData() {
  const floors = loadYaml("floors.yaml");
  const rooms = loadYaml("rooms.yaml");
  const devices = loadYaml("devices.yaml");
  const deviceTypes = loadYaml("device_types.yaml");
  const channels = loadYaml("channels.yaml");
  const integrations = loadYaml("integrations.yaml");
  const network = loadYaml("network.yaml");

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
    channels: normalizedChannels,
    integrations,
    network,
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
