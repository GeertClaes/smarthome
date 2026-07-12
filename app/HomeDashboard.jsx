"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import FloorMapLegend from "./components/FloorMapLegend";
import InteractiveBuildingMap from "./InteractiveBuildingMap";
import { useSiteContent } from "./SiteContentProvider";
import { useI18n } from "./LanguageProvider";

const FLOOR_ORDER = ["ground_floor", "basement"];

export default function HomeDashboard({ floors, buildingLevelsSvg }) {
  const { t, tl } = useI18n();
  const { ts } = useSiteContent();

  const floorOptions = useMemo(() => {
    return FLOOR_ORDER.map((id) => floors.find((floor) => floor.id === id)).filter(Boolean);
  }, [floors]);

  const [selectedFloorId, setSelectedFloorId] = useState("ground_floor");

  const currentFloor =
    floorOptions.find((floor) => floor.id === selectedFloorId) ?? floorOptions[0] ?? null;

  return (
    <div className="home-dashboard">
      <div className="building-workspace">
        <aside className="building-level-rail" aria-label={t("home.selectFloor")}>
          <InteractiveBuildingMap
            svgMarkup={buildingLevelsSvg}
            floors={floorOptions}
            selectedFloorId={currentFloor?.id ?? "ground_floor"}
            onSelectFloor={setSelectedFloorId}
          />
        </aside>

        <div className="building-workspace-divider" aria-hidden="true" />

        <div className="building-floor-panel">
          <header className="building-floor-head">
            <p className="section-kicker">{ts("home.overview_title")}</p>
            <h1 className="building-floor-title">
              {currentFloor ? tl(currentFloor.name_i18n, currentFloor.name) : t("home.title")}
            </h1>
            {currentFloor?.summary_i18n ? (
              <p className="building-floor-summary">
                {tl(currentFloor.summary_i18n, currentFloor.summary ?? "")}
              </p>
            ) : null}
            <p className="building-floor-hint">
              {currentFloor?.overview_hint_i18n
                ? tl(currentFloor.overview_hint_i18n, currentFloor.overview_hint ?? ts("home.overview_subtitle"))
                : ts("home.overview_subtitle")}
            </p>
          </header>

          {currentFloor ? (
            <div
              className={`building-floor-body ${currentFloor.map_legend?.length ? "has-legend" : ""}`}
            >
              {currentFloor.map_legend?.length ? (
                <FloorMapLegend legend={currentFloor.map_legend} />
              ) : null}
              <div className="building-floor-canvas">
                <Image
                  src={currentFloor.floorplan_image}
                  alt={tl(currentFloor.name_i18n, currentFloor.name)}
                  width={1700}
                  height={980}
                  className="home-floor-image"
                  priority
                />
              </div>
            </div>
          ) : (
            <div className="alert alert-warning mt-4">No floor image found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
