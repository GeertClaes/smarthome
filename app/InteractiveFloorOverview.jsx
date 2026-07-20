"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { getBuildingRoomBindings } from "@/lib/buildingRoomBindings";
import { useI18n } from "./LanguageProvider";

/** Same palette as InteractiveFloorMap room selection */
const BASE_ROOM_COLOR = "#BEEDE4";
const HOVER_ROOM_COLOR = "#7FD9C4";
const SELECTED_ROOM_COLOR = "#0B8A80";

/** Keep prior highlight briefly when crossing gaps between adjacent rooms */
const HIGHLIGHT_CLEAR_MS = 90;

function applyRoomFill(shapeElement, fillColor) {
  shapeElement.style.fill = fillColor;
  shapeElement.style.stroke = "none";
  shapeElement.style.strokeWidth = "0";
  shapeElement.style.filter = "none";
  shapeElement.style.opacity = "1";
  shapeElement.style.transition = "fill 220ms ease";
  shapeElement.style.cursor = "pointer";
  shapeElement.style.outline = "none";
  shapeElement.style.shapeRendering = "geometricPrecision";
}

function fillForRoom(roomId, { selectedRoomId, highlightedRoomId }) {
  if (roomId === selectedRoomId) {
    return SELECTED_ROOM_COLOR;
  }
  if (roomId === highlightedRoomId) {
    return HOVER_ROOM_COLOR;
  }
  return BASE_ROOM_COLOR;
}

export default function InteractiveFloorOverview({
  floorId,
  floorImage,
  floorLabel = "",
  overlaySvg,
  rooms = [],
  selectedRoomId,
  highlightedRoomId = null,
  onSelectRoom,
  onHighlightRoom,
}) {
  const mapRef = useRef(null);
  const bindingsRef = useRef({});
  const selectedRoomIdRef = useRef(selectedRoomId);
  const highlightedRoomIdRef = useRef(highlightedRoomId);
  const clearHighlightTimerRef = useRef(null);
  const onSelectRoomRef = useRef(onSelectRoom);
  const onHighlightRoomRef = useRef(onHighlightRoom);
  const { t, tl } = useI18n();
  const tRef = useRef(t);
  const tlRef = useRef(tl);

  const roomById = useMemo(() => Object.fromEntries(rooms.map((room) => [room.id, room])), [rooms]);

  const bindingsBySvgId = useMemo(() => {
    return Object.fromEntries(
      getBuildingRoomBindings(floorId).map((binding) => [
        binding.svgId,
        { ...binding, room: roomById[binding.roomId] ?? null },
      ]),
    );
  }, [floorId, roomById]);

  useEffect(() => {
    bindingsRef.current = bindingsBySvgId;
  }, [bindingsBySvgId]);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    highlightedRoomIdRef.current = highlightedRoomId;
  }, [highlightedRoomId]);

  useEffect(() => {
    onSelectRoomRef.current = onSelectRoom;
    onHighlightRoomRef.current = onHighlightRoom;
    tRef.current = t;
    tlRef.current = tl;
  }, [onHighlightRoom, onSelectRoom, t, tl]);

  function paintRooms() {
    const mapContainer = mapRef.current;
    if (!mapContainer) {
      return;
    }

    const selectedId = selectedRoomIdRef.current;
    const highlightedId = highlightedRoomIdRef.current;
    const bindings = bindingsRef.current;

    mapContainer.querySelectorAll("g#Rooms > [id]").forEach((shapeElement) => {
      const binding = bindings[shapeElement.id];
      if (!binding?.room) {
        shapeElement.style.pointerEvents = "none";
        shapeElement.style.fill = "transparent";
        shapeElement.style.stroke = "transparent";
        return;
      }

      const isSelected = binding.room.id === selectedId;
      applyRoomFill(
        shapeElement,
        fillForRoom(binding.room.id, {
          selectedRoomId: selectedId,
          highlightedRoomId: highlightedId,
        }),
      );
      shapeElement.classList.toggle("is-selected-area", isSelected);
      shapeElement.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function notifyHighlight(roomId) {
    if (clearHighlightTimerRef.current) {
      window.clearTimeout(clearHighlightTimerRef.current);
      clearHighlightTimerRef.current = null;
    }

    if (roomId == null) {
      clearHighlightTimerRef.current = window.setTimeout(() => {
        clearHighlightTimerRef.current = null;
        highlightedRoomIdRef.current = null;
        onHighlightRoomRef.current?.(null);
        paintRooms();
      }, HIGHLIGHT_CLEAR_MS);
      return;
    }

    highlightedRoomIdRef.current = roomId;
    onHighlightRoomRef.current?.(roomId);
  }

  // Mount overlay once per markup change. Avoid render-time dangerouslySetInnerHTML —
  // that resets the SVG (and flashes the PNG trees) on every hover state update.
  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer) {
      return undefined;
    }

    if (!overlaySvg) {
      mapContainer.innerHTML = "";
      return undefined;
    }

    mapContainer.innerHTML = overlaySvg;
    paintRooms();

    const shapes = Array.from(mapContainer.querySelectorAll("g#Rooms > [id]"));
    const removeListeners = [];

    shapes.forEach((shapeElement) => {
      const binding = bindingsRef.current[shapeElement.id];
      if (!binding?.room) {
        return;
      }

      shapeElement.setAttribute("tabindex", "0");
      shapeElement.setAttribute("role", "button");
      shapeElement.setAttribute(
        "aria-label",
        tRef.current("home.selectRoom", {
          room: tlRef.current(binding.room.name_i18n, binding.room.name),
        }),
      );

      const onMouseEnter = () => {
        // Paint immediately (floor-plan style) so React state lag can't flash the PNG.
        if (binding.room.id !== selectedRoomIdRef.current) {
          applyRoomFill(shapeElement, HOVER_ROOM_COLOR);
        }
        notifyHighlight(binding.room.id);
      };

      const onMouseLeave = () => {
        const selectedId = selectedRoomIdRef.current;
        applyRoomFill(
          shapeElement,
          binding.room.id === selectedId ? SELECTED_ROOM_COLOR : BASE_ROOM_COLOR,
        );
        notifyHighlight(null);
      };

      const onClick = () => {
        onSelectRoomRef.current?.(binding.room.id);
      };

      const onKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectRoomRef.current?.(binding.room.id);
        }
      };

      shapeElement.addEventListener("mouseenter", onMouseEnter);
      shapeElement.addEventListener("mouseleave", onMouseLeave);
      shapeElement.addEventListener("click", onClick);
      shapeElement.addEventListener("keydown", onKeyDown);

      removeListeners.push(() => {
        shapeElement.removeEventListener("mouseenter", onMouseEnter);
        shapeElement.removeEventListener("mouseleave", onMouseLeave);
        shapeElement.removeEventListener("click", onClick);
        shapeElement.removeEventListener("keydown", onKeyDown);
      });
    });

    return () => {
      if (clearHighlightTimerRef.current) {
        window.clearTimeout(clearHighlightTimerRef.current);
        clearHighlightTimerRef.current = null;
      }
      removeListeners.forEach((remove) => remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlaySvg, floorId]);

  // Sync fills when selection / list hover changes (without remounting SVG)
  useEffect(() => {
    paintRooms();
  }, [selectedRoomId, highlightedRoomId, bindingsBySvgId]);

  useEffect(() => {
    return () => {
      if (clearHighlightTimerRef.current) {
        window.clearTimeout(clearHighlightTimerRef.current);
      }
    };
  }, []);

  if (!floorImage) {
    return <div className="alert alert-warning">No floor image found.</div>;
  }

  return (
    <div className="building-floor-stack">
      <Image
        src={floorImage}
        alt={floorLabel}
        width={950}
        height={650}
        className="building-floor-bg"
        priority
      />
      {overlaySvg ? <div className="building-floor-overlay" ref={mapRef} /> : null}
    </div>
  );
}
