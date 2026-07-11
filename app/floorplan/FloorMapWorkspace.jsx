import fs from "fs";
import path from "path";
import { getData } from "@/lib/data";
import FloorPlanConsole from "./FloorPlanConsole";

const GROUND_FLOOR_SVG_BINDINGS = [
  { svgId: "Storage", roomId: "storage" },
  { svgId: "Hallway", roomId: "hallway" },
  { svgId: "MasterBedroom", roomId: "master_bedroom" },
  { svgId: "Laundry", roomId: "laundry" },
  { svgId: "Office", roomId: "home_office" },
  { svgId: "Bathroom", roomId: "bathroom" },
  { svgId: "Bedroom", roomId: "second_bedroom" },
  { svgId: "FamilyRoom", roomId: "living_dining" },
];

function loadSvgFromPublic(svgPath) {
  if (!svgPath) {
    return "";
  }

  const normalizedPath = svgPath.startsWith("/") ? svgPath.slice(1) : svgPath;
  const fullPath = path.join(process.cwd(), "public", normalizedPath);

  if (!fs.existsSync(fullPath)) {
    return "";
  }

  return fs.readFileSync(fullPath, "utf8");
}

export default function FloorMapWorkspace() {
  const { floors, rooms, devices, deviceTypes } = getData();
  const groundFloor = floors.find((floor) => floor.id === "ground_floor");

  if (!groundFloor) {
    return <div className="alert alert-warning">Ground floor data is missing.</div>;
  }

  const floorRooms = rooms.filter((room) => room.floor_id === "ground_floor");
  const roomById = Object.fromEntries(floorRooms.map((room) => [room.id, room]));

  const roomIds = new Set(floorRooms.map((room) => room.id));
  const floorDevices = devices.filter((device) => roomIds.has(device.installed_room_id));

  const devicesByRoom = floorDevices.reduce((map, device) => {
    if (!map[device.installed_room_id]) {
      map[device.installed_room_id] = 0;
    }

    map[device.installed_room_id] += 1;
    return map;
  }, {});

  const svgMarkup = loadSvgFromPublic(groundFloor.floorplan_svg);

  const roomBindings = GROUND_FLOOR_SVG_BINDINGS.map((binding) => {
    const room = roomById[binding.roomId];
    if (!room) {
      return null;
    }

    return {
      svgId: binding.svgId,
      room,
      deviceCount: devicesByRoom[room.id] ?? 0,
    };
  }).filter(Boolean);

  if (!svgMarkup || !roomBindings.length) {
    return <div className="alert alert-warning">Interactive SVG map is missing.</div>;
  }

  return (
    <FloorPlanConsole
      roomBindings={roomBindings}
      devices={floorDevices}
      deviceTypes={deviceTypes}
      svgMarkup={svgMarkup}
    />
  );
}
