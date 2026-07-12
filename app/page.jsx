import { getData } from "@/lib/data";
import { loadSvgFromPublic } from "@/lib/svg";
import HomeDashboard from "./HomeDashboard";

export default function HomePage() {
  const { floors } = getData();
  const buildingLevelsSvg = loadSvgFromPublic("/building/BuildingLevels.svg");

  return <HomeDashboard floors={floors} buildingLevelsSvg={buildingLevelsSvg} />;
}
