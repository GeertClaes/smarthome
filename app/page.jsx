import { getData } from "@/lib/data";
import { loadSvgFromPublic } from "@/lib/svg";
import HomeDashboard from "./HomeDashboard";

export default function HomePage() {
  const { floors, rooms } = getData();
  const buildingLevelsSvg = loadSvgFromPublic("/building/BuildingLevels.svg");

  const roomOverlaySvgs = Object.fromEntries(
    floors
      .filter((floor) => floor.rooms_overlay_svg)
      .map((floor) => [floor.id, loadSvgFromPublic(floor.rooms_overlay_svg)]),
  );

  return (
    <HomeDashboard
      floors={floors}
      rooms={rooms}
      buildingLevelsSvg={buildingLevelsSvg}
      roomOverlaySvgs={roomOverlaySvgs}
    />
  );
}
