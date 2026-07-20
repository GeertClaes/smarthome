"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BuildingAreaList from "./BuildingAreaList";
import BuildingRoomDetail from "./BuildingRoomDetail";
import InteractiveBuildingMap from "./InteractiveBuildingMap";
import InteractiveFloorOverview from "./InteractiveFloorOverview";
import { getBuildingRoomBindings } from "@/lib/buildingRoomBindings";
import { useSiteContent } from "./SiteContentProvider";
import { useI18n } from "./LanguageProvider";

const FLOOR_ORDER = ["ground_floor", "basement"];

export default function HomeDashboard({ floors, rooms, buildingLevelsSvg, roomOverlaySvgs }) {
  const { t, tl } = useI18n();
  const { ts } = useSiteContent();
  const router = useRouter();

  const floorOptions = useMemo(() => {
    return FLOOR_ORDER.map((id) => floors.find((floor) => floor.id === id)).filter(Boolean);
  }, [floors]);

  const [selectedFloorId, setSelectedFloorId] = useState("ground_floor");
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [highlightedRoomId, setHighlightedRoomId] = useState(null);
  const [roomsState, setRoomsState] = useState(rooms);

  useEffect(() => {
    setRoomsState(rooms);
  }, [rooms]);

  const currentFloor =
    floorOptions.find((floor) => floor.id === selectedFloorId) ?? floorOptions[0] ?? null;

  const floorRooms = useMemo(() => {
    if (!currentFloor) {
      return [];
    }
    return roomsState.filter((room) => room.floor_id === currentFloor.id);
  }, [currentFloor, roomsState]);

  const selectableAreas = useMemo(() => {
    if (!currentFloor) {
      return [];
    }

    const roomById = Object.fromEntries(floorRooms.map((room) => [room.id, room]));
    return getBuildingRoomBindings(currentFloor.id)
      .map((binding) => {
        const room = roomById[binding.roomId];
        if (!room) {
          return null;
        }
        return {
          ...binding,
          room,
        };
      })
      .filter(Boolean);
  }, [currentFloor, floorRooms]);

  const selectedRoom = useMemo(() => {
    return floorRooms.find((room) => room.id === selectedRoomId) ?? null;
  }, [floorRooms, selectedRoomId]);

  useEffect(() => {
    setSelectedRoomId(null);
    setHighlightedRoomId(null);
  }, [selectedFloorId]);

  function handleRoomImagesChange(roomId, images) {
    setRoomsState((current) =>
      current.map((room) => (room.id === roomId ? { ...room, images } : room)),
    );
    router.refresh();
  }

  const overlaySvg = currentFloor ? (roomOverlaySvgs?.[currentFloor.id] ?? "") : "";

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
            <div className="building-floor-body">
              <div className="building-floor-canvas">
                <InteractiveFloorOverview
                  floorId={currentFloor.id}
                  floorImage={currentFloor.floorplan_image}
                  floorLabel={tl(currentFloor.name_i18n, currentFloor.name)}
                  overlaySvg={overlaySvg}
                  rooms={floorRooms}
                  selectedRoomId={selectedRoomId}
                  highlightedRoomId={highlightedRoomId}
                  onSelectRoom={setSelectedRoomId}
                  onHighlightRoom={setHighlightedRoomId}
                />
              </div>
            </div>
          ) : (
            <div className="alert alert-warning mt-4">No floor image found.</div>
          )}
        </div>
      </div>

      <div className="building-detail-row">
        <BuildingAreaList
          areas={selectableAreas}
          selectedRoomId={selectedRoomId}
          highlightedRoomId={highlightedRoomId}
          onSelectRoom={setSelectedRoomId}
          onHighlightRoom={setHighlightedRoomId}
        />
        <BuildingRoomDetail room={selectedRoom} onImagesChange={handleRoomImagesChange} />
      </div>
    </div>
  );
}
