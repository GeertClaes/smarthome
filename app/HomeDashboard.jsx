"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "./LanguageProvider";

const FLOOR_ORDER = ["ground_floor", "basement"];

export default function HomeDashboard({ floors, rooms, devices }) {
  const { t, tl } = useI18n();

  const floorOptions = useMemo(() => {
    return FLOOR_ORDER.map((id) => floors.find((floor) => floor.id === id)).filter(Boolean);
  }, [floors]);

  const roomById = useMemo(() => {
    return Object.fromEntries(rooms.map((room) => [room.id, room]));
  }, [rooms]);

  const [selectedFloorId, setSelectedFloorId] = useState("ground_floor");

  const currentFloor =
    floorOptions.find((floor) => floor.id === selectedFloorId) ?? floorOptions[0] ?? null;

  const currentFloorDevices = useMemo(() => {
    if (!currentFloor) {
      return [];
    }

    return devices
      .filter((device) => roomById[device.installed_room_id]?.floor_id === currentFloor.id)
      .toSorted((a, b) => a.name.localeCompare(b.name));
  }, [currentFloor, devices, roomById]);

  return (
    <div className="space-y-5 home-dashboard">
      <section className="home-overview-block p-3 md:p-4">
        <h1 className="text-3xl md:text-4xl font-bold">{t("home.overviewTitle")}</h1>
        <p className="text-base-content/70 mt-2">{t("home.overviewSubtitle")}</p>

        <div className="building-overview-grid mt-5">
          <aside className="building-floor-selector">
            <p className="section-kicker">{t("home.selectFloor")}</p>
            <div className="building-floor-stack">
              {floorOptions.map((floor) => {
                const isActive = currentFloor?.id === floor.id;
                return (
                  <button
                    key={floor.id}
                    type="button"
                    className={`building-floor-btn ${isActive ? "is-active" : ""}`}
                    onClick={() => setSelectedFloorId(floor.id)}
                  >
                    {tl(floor.name_i18n, floor.name)}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="building-main-card">
            <div className="building-main-head">
              <div>
                <p className="section-kicker">{t("home.kicker")}</p>
                <p className="text-xl font-semibold mt-1">
                  {currentFloor ? tl(currentFloor.name_i18n, currentFloor.name) : t("home.title")}
                </p>
              </div>

              <div className="floor-toggle-row" role="tablist" aria-label={t("home.toggleLabel")}>
                {floorOptions.map((floor) => (
                  <button
                    key={floor.id}
                    type="button"
                    role="tab"
                    aria-selected={currentFloor?.id === floor.id}
                    className={`floor-toggle-btn ${currentFloor?.id === floor.id ? "is-active" : ""}`}
                    onClick={() => setSelectedFloorId(floor.id)}
                  >
                    {tl(floor.name_i18n, floor.name)}
                  </button>
                ))}
              </div>
            </div>

            {currentFloor ? (
              <div className="home-floor-stage is-dashboard-map">
                <Image
                  src={currentFloor.floorplan_image}
                  alt={tl(currentFloor.name_i18n, currentFloor.name)}
                  width={1700}
                  height={980}
                  className="home-floor-image"
                  priority
                />
              </div>
            ) : (
              <div className="alert alert-warning">No floor image found.</div>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
              <Link href="/floorplan" className="btn btn-primary btn-sm">
                {t("home.openInteractive")}
              </Link>
              <Link href="/devices" className="btn btn-outline btn-sm">
                {t("home.openDevices")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-table-block p-2 md:p-3">
        <h2 className="text-xl md:text-2xl font-bold">{t("home.quickReference")}</h2>
        <div className="data-surface mt-4 home-table-surface">
          <table className="data-grid data-grid-readable">
            <thead>
              <tr>
                <th>{t("home.table.device")}</th>
                <th>{t("home.table.model")}</th>
                <th>{t("home.table.room")}</th>
                <th>{t("home.table.ip")}</th>
                <th>{t("home.table.mac")}</th>
              </tr>
            </thead>
            <tbody>
              {currentFloorDevices.map((device) => {
                const room = roomById[device.installed_room_id];
                return (
                  <tr key={device.id}>
                    <td>{device.name}</td>
                    <td>{device.model || "-"}</td>
                    <td>{room ? tl(room.name_i18n, room.name) : device.installed_location}</td>
                    <td className="font-mono text-sm">{device.ip}</td>
                    <td className="font-mono text-sm">{device.mac}</td>
                  </tr>
                );
              })}
              {currentFloorDevices.length === 0 ? (
                <tr>
                  <td colSpan={5}>{t("devices.none")}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
