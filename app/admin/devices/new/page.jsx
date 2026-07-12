import Link from "next/link";
import { getData } from "@/lib/data";
import DeviceForm from "../../components/DeviceForm";

export const dynamic = "force-dynamic";

export default function NewDevicePage() {
  const { rooms, deviceTypes, devicePoints, deviceModels } = getData();
  const typeNames = deviceTypes.map((type) => type.name);
  const floorPlanPoints = devicePoints.filter((point) => rooms.some((room) => room.id === point.room_id));

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="section-kicker">
          <Link href="/admin/devices" className="admin-breadcrumb-link">
            Devices
          </Link>{" "}
          / New
        </p>
        <h1 className="admin-page-title">Add device</h1>
        <p className="admin-page-lead">
          Create a device in the registry. Assign a floor plan point here or from the interactive map.
        </p>
      </header>

      <DeviceForm mode="create" rooms={rooms} deviceTypes={typeNames} deviceModels={deviceModels} devicePoints={floorPlanPoints} />
    </div>
  );
}
