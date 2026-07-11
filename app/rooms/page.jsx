import Link from "next/link";
import { getData } from "@/lib/data";

export default function RoomsPage() {
  const { rooms, devices, channels } = getData();

  return (
    <div className="space-y-7">
      <section className="panel p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-[#0B8A80]">Spatial Index</p>
        <h1 className="text-3xl md:text-5xl font-bold mt-1">Rooms</h1>
        <p className="text-base-content/70 mt-2 max-w-3xl">
          Room-level index with installed device count and channel coverage.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => {
          const installedCount = devices.filter(
            (device) => device.installed_room_id === room.id,
          ).length;
          const channelCount = channels.filter((channel) => channel.room_id === room.id).length;
          return (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="panel p-4 hover:-translate-y-0.5 transition"
            >
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">{room.name}</h2>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full border border-base-300 px-3 py-1">
                    {installedCount} installed devices
                  </span>
                  <span className="rounded-full border border-base-300 px-3 py-1">
                    {channelCount} served channels
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
