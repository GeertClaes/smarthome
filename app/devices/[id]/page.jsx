import Link from "next/link";
import PhotoGallery from "@/app/components/PhotoGallery";
import { getData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  const { devices } = getData();
  return devices.map((device) => ({ id: device.id }));
}

export default async function DeviceDetailPage({ params }) {
  const { id } = await params;
  const { devices, rooms, channels, integrations } = getData();
  const device = devices.find((entry) => entry.id === id);

  if (!device) {
    return <div className="alert alert-warning">Device not found.</div>;
  }

  const room = rooms.find((entry) => entry.id === device.installed_room_id);
  const deviceChannels = channels.filter((channel) => channel.device_id === device.id);
  const integrationMap = Object.fromEntries(integrations.map((item) => [item.channel_id, item]));
  const online = String(device.status).toLowerCase().includes("online");

  return (
    <div className="space-y-7">
      <section className="panel p-5 md:p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <h1 className="text-3xl md:text-5xl font-bold">{device.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/admin/devices/${device.id}/edit`} className="btn btn-sm btn-outline">
                Edit
              </Link>
              <span className={`status-pill ${online ? "is-online" : "is-offline"}`}>
                {device.status}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm rounded-xl border border-base-300 bg-base-100 p-4">
            <p>
              <strong>Type:</strong> {device.device_type}
            </p>
            <p>
              <strong>Model:</strong> {device.model}
            </p>
            <p>
              <strong>IP:</strong> <span className="font-mono">{device.ip}</span>
            </p>
            <p>
              <strong>MAC:</strong> <span className="font-mono">{device.mac}</span>
            </p>
            <p>
              <strong>Installed room:</strong> {room?.name ?? device.installed_location}
            </p>
            <p>
              <strong>Connects via:</strong> {device.connects_via}
            </p>
          </div>

          {device.notes ? (
            <p className="text-sm text-base-content/80">
              <strong>Notes:</strong> {device.notes}
            </p>
          ) : null}

          <PhotoGallery images={device.images} altPrefix={device.name} />
        </div>
      </section>

      <section className="panel p-5 md:p-6">
        <h2 className="panel-title">Channels and Control Surfaces</h2>
        <p className="text-base-content/70 mt-2 mb-4">
          Integration availability for channels exposed by this device.
        </p>
        <div className="data-surface">
          <table className="data-grid">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Type</th>
                <th>Wall</th>
                <th>HA</th>
                <th>Alexa</th>
                <th>Display</th>
              </tr>
            </thead>
            <tbody>
              {deviceChannels.map((channel) => {
                const i = integrationMap[channel.id] ?? {};
                return (
                  <tr key={channel.id}>
                    <td>{channel.controls}</td>
                    <td>{channel.type}</td>
                    <td>{i.wall_switch ? "Enabled" : "No"}</td>
                    <td>{i.home_assistant ? "Enabled" : "No"}</td>
                    <td>{i.alexa ? "Enabled" : "No"}</td>
                    <td>{i.wall_display ? "Enabled" : "No"}</td>
                  </tr>
                );
              })}
              {deviceChannels.length === 0 ? (
                <tr>
                  <td colSpan={6}>No channels recorded.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
