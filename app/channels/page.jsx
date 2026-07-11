import { getData } from "@/lib/data";

export default function ChannelsPage() {
  const { channels, devices, rooms, integrations } = getData();
  const deviceMap = Object.fromEntries(devices.map((device) => [device.id, device]));
  const roomMap = Object.fromEntries(rooms.map((room) => [room.id, room.name]));
  const integrationMap = Object.fromEntries(integrations.map((item) => [item.channel_id, item]));

  return (
    <div className="space-y-7">
      <section className="panel p-5 md:p-6">
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#0B8A80]">Control Matrix</p>
            <h1 className="text-3xl md:text-5xl font-bold mt-1">Channels</h1>
            <p className="text-base-content/70 mt-2">
              Output channels with room scope and integration touchpoints.
            </p>
          </div>
          <span className="rounded-full border border-base-300 px-3 py-1 text-sm">
            {channels.length} outputs
          </span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {channels.map((channel) => {
          const device = deviceMap[channel.device_id];
          const integration = integrationMap[channel.id] ?? {};
          return (
            <article key={channel.id} className="panel p-4">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">{channel.controls}</h2>
                <p className="text-sm text-base-content/70">
                  Device: {device?.name ?? channel.device_id}
                </p>
                <p className="text-sm">
                  Room served: {roomMap[channel.room_id] ?? channel.room_id}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span
                    className={`badge ${integration.wall_switch ? "badge-success" : "badge-ghost"}`}
                  >
                    Wall switch
                  </span>
                  <span
                    className={`badge ${integration.home_assistant ? "badge-success" : "badge-ghost"}`}
                  >
                    HA
                  </span>
                  <span className={`badge ${integration.alexa ? "badge-success" : "badge-ghost"}`}>
                    Alexa
                  </span>
                  <span
                    className={`badge ${integration.wall_display ? "badge-success" : "badge-ghost"}`}
                  >
                    Wall display
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
