import fs from "fs";
import path from "path";
import yaml from "js-yaml";

function resolveDataDir(input, fallbackDirName) {
  if (!input) {
    return path.join(process.cwd(), fallbackDirName);
  }

  return path.isAbsolute(input) ? input : path.join(process.cwd(), input);
}

const DATA_DIR = resolveDataDir(process.env.DATA_DIR, "runtime-data");
const SEED_DATA_DIR = resolveDataDir(process.env.SEED_DATA_DIR, "data");

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getDataFilePath(fileName) {
  ensureDataDir();

  const fullPath = path.join(DATA_DIR, fileName);
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  const dataDirResolved = path.resolve(DATA_DIR);
  const seedDirResolved = path.resolve(SEED_DATA_DIR);
  const seedPath = path.join(SEED_DATA_DIR, fileName);
  if (dataDirResolved !== seedDirResolved && fs.existsSync(seedPath)) {
    fs.copyFileSync(seedPath, fullPath);
    return fullPath;
  }

  throw new Error(`Data file not found: ${fileName}`);
}

export function readYamlFile(fileName) {
  const fullPath = getDataFilePath(fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  return yaml.load(fileContents);
}

export function writeYamlFile(fileName, data) {
  ensureDataDir();
  const fullPath = path.join(DATA_DIR, fileName);
  const content = yaml.dump(data, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
  });
  fs.writeFileSync(fullPath, content, "utf8");
}

export function getDevicesRaw() {
  return readYamlFile("devices.yaml");
}

export function getRoomsRaw() {
  return readYamlFile("rooms.yaml");
}

export function saveDevices(devices) {
  writeYamlFile("devices.yaml", devices);
}

export function saveRooms(rooms) {
  writeYamlFile("rooms.yaml", rooms);
}

export function getDevicePointsRaw() {
  return readYamlFile("device_points.yaml");
}

export function saveDevicePoints(devicePoints) {
  writeYamlFile("device_points.yaml", devicePoints);
}

export function getChannelsRaw() {
  return readYamlFile("channels.yaml");
}

export function saveChannels(channels) {
  writeYamlFile("channels.yaml", channels);
}

export function getSiteRaw() {
  return readYamlFile("site.yaml");
}

export function saveSite(site) {
  writeYamlFile("site.yaml", site);
}

export function getFloorsRaw() {
  return readYamlFile("floors.yaml");
}

export function saveFloors(floors) {
  writeYamlFile("floors.yaml", floors);
}

export function getDeviceModelsRaw() {
  return readYamlFile("device_models.yaml");
}

export function saveDeviceModels(deviceModels) {
  writeYamlFile("device_models.yaml", deviceModels);
}

export function slugifyId(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}
