import { getData } from "@/lib/data";
import { loadSvgFromPublic } from "@/lib/svg";
import FloorPlanConsole from "./FloorPlanConsole";

/** SVG room shapes in FloorMap.svg → app room ids (ground floor only; basement is on Building). */
const SVG_ROOM_BINDINGS = [
  { svgId: "room_ld", roomId: "living_dining" },
  { svgId: "room_st", roomId: "storage" },
  { svgId: "room_ha", roomId: "hallway" },
  { svgId: "room_mb", roomId: "master_bedroom" },
  { svgId: "room_la", roomId: "laundry" },
  { svgId: "room_of", roomId: "home_office" },
  { svgId: "room_ba", roomId: "bathroom" },
  { svgId: "room_br", roomId: "second_bedroom" },
];

export default function FloorMapWorkspace() {
  const { floors, rooms, devices, deviceTypes, deviceModels, channels, integrations, devicePoints } = getData();
  const groundFloor = floors.find((floor) => floor.id === "ground_floor");

  if (!groundFloor) {
    return <div className="alert alert-warning">Ground floor data is missing.</div>;
  }

  const boundRoomIds = new Set(SVG_ROOM_BINDINGS.map((binding) => binding.roomId));
  const floorRooms = rooms.filter((room) => boundRoomIds.has(room.id));
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

  const roomBindings = SVG_ROOM_BINDINGS.map((binding) => {
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
      registryDevices={devices}
      deviceTypes={deviceTypes}
      deviceModels={deviceModels}
      channels={channels}
      integrations={integrations}
      svgMarkup={svgMarkup}
      devicePointsRegistry={devicePoints}
    />
  );
}
