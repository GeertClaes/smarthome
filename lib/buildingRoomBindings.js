/** SVG hit-path ids on Building overview overlays → app room ids + legend colors */

export const PROPERTY_COLOR = "#BEEDE4";
export const PROPERTY_STROKE = "#0B8A80";

export const GROUND_FLOOR_ROOM_BINDINGS = [
  { svgId: "Garden", roomId: "garden", color: PROPERTY_COLOR, stroke: PROPERTY_STROKE },
  { svgId: "ourCarPark", roomId: "car_park", color: PROPERTY_COLOR, stroke: PROPERTY_STROKE },
  { svgId: "Storage", roomId: "storage", color: PROPERTY_COLOR, stroke: PROPERTY_STROKE },
  { svgId: "Hallway", roomId: "hallway", color: PROPERTY_COLOR, stroke: PROPERTY_STROKE },
  { svgId: "MasterBedroom", roomId: "master_bedroom", color: PROPERTY_COLOR, stroke: PROPERTY_STROKE },
  { svgId: "Laundry", roomId: "laundry", color: PROPERTY_COLOR, stroke: PROPERTY_STROKE },
  { svgId: "Office", roomId: "home_office", color: PROPERTY_COLOR, stroke: PROPERTY_STROKE },
  { svgId: "Bathroom", roomId: "bathroom", color: PROPERTY_COLOR, stroke: PROPERTY_STROKE },
  { svgId: "Bedroom", roomId: "second_bedroom", color: PROPERTY_COLOR, stroke: PROPERTY_STROKE },
  { svgId: "FamilyRoom", roomId: "living_dining", color: PROPERTY_COLOR, stroke: PROPERTY_STROKE },
];

export const BASEMENT_ROOM_BINDINGS = [
  {
    svgId: "PrivateStorage",
    roomId: "basement_cellar",
    color: "#B8EDE8",
    stroke: "#0B8A80",
  },
  {
    svgId: "Gym",
    roomId: "gym",
    color: "#C4B0E0",
    stroke: "#8B6BB8",
  },
  {
    svgId: "BikeRoom",
    roomId: "basement_shared_bike_room",
    color: "#F0E4A8",
    stroke: "#C9B84A",
  },
];

export const BUILDING_ROOM_BINDINGS_BY_FLOOR = {
  ground_floor: GROUND_FLOOR_ROOM_BINDINGS,
  basement: BASEMENT_ROOM_BINDINGS,
};

export function getBuildingRoomBindings(floorId) {
  return BUILDING_ROOM_BINDINGS_BY_FLOOR[floorId] ?? [];
}

export function hexToRgba(hex, alpha) {
  const raw = String(hex || "").replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => char + char)
          .join("")
      : raw;

  if (full.length !== 6) {
    return `rgba(127, 217, 196, ${alpha})`;
  }

  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
