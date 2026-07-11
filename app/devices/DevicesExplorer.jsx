"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/app/LanguageProvider";

function DeviceTypeIcon({ deviceType }) {
  const type = String(deviceType || "").toLowerCase();

  if (type.includes("shutter")) {
    return <span className="device-icon">▥</span>;
  }

  if (type.includes("relay")) {
    return <span className="device-icon">⎍</span>;
  }

  if (type.includes("switch")) {
    return <span className="device-icon">⌽</span>;
  }

  if (type.includes("plug")) {
    return <span className="device-icon">⏚</span>;
  }

  if (type.includes("light") || type.includes("globe") || type.includes("bulb")) {
    return <span className="device-icon">◉</span>;
  }

  if (type.includes("sensor")) {
    return <span className="device-icon">◌</span>;
  }

  return <span className="device-icon">◇</span>;
}

function isOnline(status) {
  return String(status).toLowerCase().includes("online");
}

function toDeviceTypeKey(type) {
  return String(type || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function DevicesExplorer({ devices, rooms, deviceTypes }) {
  const { t, tl } = useI18n();
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const deviceTypeById = useMemo(() => {
    return Object.fromEntries((deviceTypes ?? []).map((deviceType) => [deviceType.id, deviceType]));
  }, [deviceTypes]);

  const roomOptions = useMemo(() => {
    return rooms.map((room) => ({
      id: room.id,
      name: tl(room.name_i18n, room.name),
    }));
  }, [rooms, tl]);

  const roomNameById = useMemo(() => {
    return Object.fromEntries(roomOptions.map((room) => [room.id, room.name]));
  }, [roomOptions]);

  const typeOptions = useMemo(() => {
    return [...new Set(devices.map((device) => device.device_type))]
      .map((type) => ({
        id: toDeviceTypeKey(type),
        value: type,
        label: tl(deviceTypeById[toDeviceTypeKey(type)]?.name_i18n, type),
      }))
      .toSorted((a, b) => a.label.localeCompare(b.label));
  }, [devices, deviceTypeById, tl]);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesRoom = selectedRoom === "all" || device.installed_room_id === selectedRoom;
      const matchesType = selectedType === "all" || device.device_type === selectedType;
      return matchesRoom && matchesType;
    });
  }, [devices, selectedRoom, selectedType]);

  return (
    <div className="space-y-6">
      <section className="panel p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.22em] text-[#7FD9C4]">{t("devices.kicker")}</p>
        <h1 className="text-3xl md:text-5xl font-bold mt-1">{t("devices.title")}</h1>
        <p className="text-base-content/70 mt-2 max-w-3xl">{t("devices.subtitle")}</p>
      </section>

      <section className="devices-layout">
        <aside className="panel p-5 devices-filter-panel">
          <h2 className="text-lg font-semibold">{t("devices.filters")}</h2>

          <p className="filter-label">{t("devices.filterRoom")}</p>
          <div className="filter-chip-wrap">
            <button
              type="button"
              className={`filter-chip ${selectedRoom === "all" ? "is-active" : ""}`}
              onClick={() => setSelectedRoom("all")}
            >
              {t("devices.allRooms")}
            </button>
            {roomOptions.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`filter-chip ${selectedRoom === room.id ? "is-active" : ""}`}
                onClick={() => setSelectedRoom(room.id)}
              >
                {room.name}
              </button>
            ))}
          </div>

          <p className="filter-label">{t("devices.filterType")}</p>
          <div className="filter-chip-wrap">
            <button
              type="button"
              className={`filter-chip ${selectedType === "all" ? "is-active" : ""}`}
              onClick={() => setSelectedType("all")}
            >
              {t("devices.allTypes")}
            </button>
            {typeOptions.map((type) => (
              <button
                key={type.value}
                type="button"
                className={`filter-chip ${selectedType === type.value ? "is-active" : ""}`}
                onClick={() => setSelectedType(type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-base-content/70 mt-4">
            {t("devices.results", { count: filteredDevices.length })}
          </p>
        </aside>

        <div className="devices-card-grid">
          {filteredDevices.map((device) => (
            <article key={device.id} className="panel p-4 device-card">
              <div className="device-card-top">
                <DeviceTypeIcon deviceType={device.device_type} />
                <div>
                  <h3 className="font-semibold text-lg">{device.name}</h3>
                  <p className="text-sm text-base-content/70">
                    {tl(
                      deviceTypeById[toDeviceTypeKey(device.device_type)]?.name_i18n,
                      device.device_type,
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-sm text-base-content/75">
                <p>{roomNameById[device.installed_room_id] ?? device.installed_location}</p>
                <p className="font-mono text-xs">{device.ip}</p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <span
                  className={`status-pill ${isOnline(device.status) ? "is-online" : "is-offline"}`}
                >
                  {device.status}
                </span>
                <Link href={`/devices/${device.id}`} className="btn btn-xs btn-outline">
                  {t("devices.openDetails")}
                </Link>
              </div>
            </article>
          ))}

          {filteredDevices.length === 0 ? (
            <div className="panel p-5">
              <p className="text-base-content/70">{t("devices.none")}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
