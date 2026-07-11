import { getData } from "@/lib/data";
import HomeDashboard from "./HomeDashboard";

export default function HomePage() {
  const { floors, rooms, devices } = getData();

  return <HomeDashboard floors={floors} rooms={rooms} devices={devices} />;
}
