import Link from "next/link";
import { getData } from "@/lib/data";
import AdminDevicesList from "../components/AdminDevicesList";

export const dynamic = "force-dynamic";

export default function AdminDevicesPage() {
  const { devices, rooms, devicePoints } = getData();
  const sortedDevices = [...devices].toSorted((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="section-kicker">Devices</p>
        <div className="admin-page-title-row">
          <div>
            <h1 className="admin-page-title">Device registry</h1>
            <p className="admin-page-lead">
              Add, edit, or permanently delete devices. Assign floor plan points here or from the interactive map.
            </p>
          </div>
          <Link href="/admin/devices/new" className="btn btn-primary btn-sm">
            Add device
          </Link>
        </div>
      </header>

      <AdminDevicesList devices={sortedDevices} rooms={rooms} devicePoints={devicePoints} />
    </div>
  );
}
