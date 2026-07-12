import Link from "next/link";
import { notFound } from "next/navigation";
import { getData } from "@/lib/data";
import DeviceForm from "../../../components/DeviceForm";

export const dynamic = "force-dynamic";

export default async function EditDevicePage({ params }) {
  const { id } = await params;
  const { devices, rooms, deviceTypes, devicePoints, deviceModels } = getData();
  const device = devices.find((entry) => entry.id === id);

  if (!device) {
    notFound();
  }

  const typeNames = deviceTypes.map((type) => type.name);
  const floorPlanPoints = devicePoints.filter((point) => rooms.some((room) => room.id === point.room_id));

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="section-kicker">
          <Link href="/admin/devices" className="admin-breadcrumb-link">
            Devices
          </Link>{" "}
          / Edit
        </p>
        <h1 className="admin-page-title">{device.name}</h1>
        <p className="admin-page-lead">Update registry details, placement, and photos. Delete the device permanently in the danger zone at the bottom.</p>
      </header>

      <DeviceForm
        device={device}
        rooms={rooms}
        deviceTypes={typeNames}
          deviceModels={deviceModels}
          devicePoints={floorPlanPoints}
        mode="edit"
      />
    </div>
  );
}
