import { getData } from "@/lib/data";
import DevicesExplorer from "./DevicesExplorer";

export default function DevicesPage() {
  const { devices, rooms, deviceTypes } = getData();

  return <DevicesExplorer devices={devices} rooms={rooms} deviceTypes={deviceTypes} />;
}
