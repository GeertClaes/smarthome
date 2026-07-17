/** SVG hit-path ids on Building overview overlays → app room ids */

export const GROUND_FLOOR_ROOM_BINDINGS = [
  { svgId: "Garden", roomId: "garden" },
  { svgId: "ourCarPark", roomId: "car_park" },
  { svgId: "Storage", roomId: "storage" },
  { svgId: "Hallway", roomId: "hallway" },
  { svgId: "MasterBedroom", roomId: "master_bedroom" },
  { svgId: "Laundry", roomId: "laundry" },
  { svgId: "Office", roomId: "home_office" },
  { svgId: "Bathroom", roomId: "bathroom" },
  { svgId: "Bedroom", roomId: "second_bedroom" },
  { svgId: "FamilyRoom", roomId: "living_dining" },
];

export const BASEMENT_ROOM_BINDINGS = [
  { svgId: "PrivateStorage", roomId: "basement_cellar" },
  { svgId: "Gym", roomId: "gym" },
  { svgId: "BikeRoom", roomId: "basement_shared_bike_room" },
];

export const BUILDING_ROOM_BINDINGS_BY_FLOOR = {
  ground_floor: GROUND_FLOOR_ROOM_BINDINGS,
  basement: BASEMENT_ROOM_BINDINGS,
};

export function getBuildingRoomBindings(floorId) {
  return BUILDING_ROOM_BINDINGS_BY_FLOOR[floorId] ?? [];
}
