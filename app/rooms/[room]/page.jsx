import Link from "next/link";
import PhotoGallery from "@/app/components/PhotoGallery";
import { getData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  const { rooms } = getData();
  return rooms.map((room) => ({ room: room.id }));
}

export default async function RoomDetailPage({ params }) {
  const { room } = await params;
  const { rooms, devices, channels } = getData();
  const currentRoom = rooms.find((entry) => entry.id === room);

  if (!currentRoom) {
    return <div className="alert alert-warning">Room not found.</div>;
  }

  const installed = devices.filter((device) => device.installed_room_id === room);
  const served = channels.filter((channel) => channel.room_id === room);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{currentRoom.name}</h1>
          <p className="text-base-content/70">Physical install and served-output split view.</p>
        </div>
        <Link href={`/admin/rooms/${currentRoom.id}/edit`} className="btn btn-sm btn-outline">
          Edit room
        </Link>
      </div>

      <PhotoGallery images={currentRoom.images} altPrefix={currentRoom.name} />

      <section className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Devices physically installed here</h2>
          <ul className="list-disc pl-5 space-y-1">
            {installed.map((device) => (
              <li key={device.id}>
                <Link href={`/devices/${device.id}`} className="link link-primary">
                  {device.name}
                </Link>
              </li>
            ))}
            {installed.length === 0 ? <li>None recorded.</li> : null}
          </ul>
        </div>
      </section>

      <section className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Channels served in this room</h2>
          <ul className="list-disc pl-5 space-y-1">
            {served.map((channel) => (
              <li key={channel.id}>{channel.controls}</li>
            ))}
            {served.length === 0 ? <li>None recorded.</li> : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
