"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/app/LanguageProvider";
import InteractiveFloorMap from "./[floor]/InteractiveFloorMap";

function toDeviceTypeKey(type) {
  return String(type || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getDeviceGlyph(type) {
  const normalized = String(type || "").toLowerCase();

  if (normalized.includes("shutter")) {
    return "▥";
  }

  if (normalized.includes("relay")) {
    return "⎍";
  }

  if (normalized.includes("switch")) {
    return "⌽";
  }

  if (normalized.includes("plug")) {
    return "⏚";
  }

  if (normalized.includes("light") || normalized.includes("globe") || normalized.includes("bulb")) {
    return "◉";
  }

  return "◇";
}

export default function FloorPlanConsole({ roomBindings, devices, deviceTypes, svgMarkup }) {
  const { t, tl } = useI18n();
  const [selectedRoomId, setSelectedRoomId] = useState(roomBindings[0]?.room.id ?? null);

  const selectedBinding = useMemo(() => {
    return (
      roomBindings.find((binding) => binding.room.id === selectedRoomId) ?? roomBindings[0] ?? null
    );
  }, [roomBindings, selectedRoomId]);

  const floorDevices = useMemo(() => {
    const roomIds = new Set(roomBindings.map((binding) => binding.room.id));
    return devices
      .filter((device) => roomIds.has(device.installed_room_id))
      .toSorted((a, b) => a.name.localeCompare(b.name));
  }, [devices, roomBindings]);

  const devicesByRoom = useMemo(() => {
    return floorDevices.reduce((map, device) => {
      if (!map[device.installed_room_id]) {
        map[device.installed_room_id] = [];
      }

      map[device.installed_room_id].push(device);
      return map;
    }, {});
  }, [floorDevices]);

  const deviceTypeById = useMemo(() => {
    return Object.fromEntries((deviceTypes ?? []).map((deviceType) => [deviceType.id, deviceType]));
  }, [deviceTypes]);

  const selectedRoomDevices = selectedBinding ? (devicesByRoom[selectedBinding.room.id] ?? []) : [];

  return (
    <div className="floorplan-console">
      <section className="floorplan-stage p-4 md:p-5">
        <div className="floorplan-stage-head">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t("floorplan.title")}</h1>
            <p className="text-base-content/70 mt-1">{t("floorplan.subtitle")}</p>
          </div>
        </div>

        {svgMarkup ? (
          <div className="floorplan-map-shell">
            <InteractiveFloorMap
              svgMarkup={svgMarkup}
              roomBindings={roomBindings}
              selectedRoomId={selectedBinding?.room.id ?? null}
              onSelectRoom={setSelectedRoomId}
            />
          </div>
        ) : (
          <div className="alert alert-warning">Interactive SVG map is missing.</div>
        )}
      </section>

      <aside className="floorplan-rail floorplan-rail-right p-0">
        {selectedBinding ? (
          <>
            <div className="floorplan-rail-header">
              <h2 className="text-xl font-semibold">
                {tl(selectedBinding.room.name_i18n, selectedBinding.room.name)}
              </h2>
              <p className="text-sm text-base-content/70">
                {t("floorplan.devicesCount", { count: selectedRoomDevices.length })}
              </p>
            </div>

            <div className="room-device-list">
              {selectedRoomDevices.map((device) => {
                const typeKey = toDeviceTypeKey(device.device_type);
                return (
                  <Link href={`/devices/${device.id}`} key={device.id} className="room-device-card">
                    <span className="room-device-icon">{getDeviceGlyph(device.device_type)}</span>
                    <div>
                      <p className="room-device-name">{device.name}</p>
                      <p className="room-device-meta">{device.ip}</p>
                    </div>
                    <span className="room-device-tag">
                      {tl(deviceTypeById[typeKey]?.name_i18n, device.device_type)}
                    </span>
                  </Link>
                );
              })}

              {selectedRoomDevices.length === 0 ? (
                <p className="text-sm text-base-content/70 px-4 pb-4">{t("devices.none")}</p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="floorplan-rail-header">
            <p className="text-sm text-base-content/70">{t("floorplan.emptyState")}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
