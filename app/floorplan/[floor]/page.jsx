import { getData } from "@/lib/data";
import FloorMapWorkspace from "../FloorMapWorkspace";

export const dynamicParams = false;

export function generateStaticParams() {
  const { floors } = getData();
  return floors.map((floor) => ({ floor: floor.id }));
}

export default function FloorplanByFloorPage() {
  return <FloorMapWorkspace />;
}
