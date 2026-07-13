"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function statusClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("online")) {
    return "is-online";
  }
  if (normalized.includes("offline") || normalized.includes("idle")) {
    return "is-offline";
  }
  return "is-unknown";
}

export default function AdminDevicesList({ devices, rooms, devicePoints }) {
  const [query, setQuery] = useState("");
  const roomById = useMemo(() => Object.fromEntries(rooms.map((room) => [room.id, room])), [rooms]);
  const pointByMarker = useMemo(
    () => new Map(devicePoints.map((point) => [point.svg_marker_id, point])),
    [devicePoints],
  );

  const filteredDevices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return devices;
    }

    return devices.filter((device) => {
      const point = device.floorplan_marker_id ? pointByMarker.get(device.floorplan_marker_id) : null;
      const haystack = [
        device.name,
        device.current_name,
        device.device_type,
        device.status,
        roomById[device.installed_room_id]?.name,
        device.installed_location,
        point?.svg_marker_id,
        point?.code,
        device.floorplan_marker_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [devices, pointByMarker, query, roomById]);

  return (
    <>
      <div className="admin-list-toolbar">
        <label className="admin-search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search devices…"
            aria-label="Search devices"
          />
        </label>
        <p className="admin-list-meta">
          {filteredDevices.length} of {devices.length} devices
        </p>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-interactive">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Room</th>
              <th>Floor plan</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length ? (
              filteredDevices.map((device) => {
                const point = device.floorplan_marker_id
                  ? pointByMarker.get(device.floorplan_marker_id)
                  : null;
                const editHref = `/admin/devices/${device.id}/edit`;

                return (
                  <tr key={device.id}>
                    <td>
                      <Link href={editHref} className="admin-table-row-link">
                        <span className="admin-table-primary">{device.name}</span>
                        {device.current_name ? (
                          <span className="admin-table-secondary">{device.current_name}</span>
                        ) : null}
                      </Link>
                    </td>
                    <td>{device.device_type}</td>
                    <td>{roomById[device.installed_room_id]?.name ?? device.installed_location ?? "—"}</td>
                    <td>
                      {point?.svg_marker_id || device.floorplan_marker_id ? (
                        point?.svg_marker_id || device.floorplan_marker_id
                      ) : (
                        <span className="admin-table-muted">Not on map</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill status-pill-compact ${statusClass(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="admin-table-actions">
                      <Link href={editHref} className="btn btn-ghost btn-xs">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="admin-table-empty">
                  No devices match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
