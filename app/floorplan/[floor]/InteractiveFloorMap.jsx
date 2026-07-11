"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/app/LanguageProvider";

const BASE_ROOM_COLOR = "#BEEDE4";
const HOVER_ROOM_COLOR = "#7FD9C4";
const SELECTED_ROOM_COLOR = "#0B8A80";

export default function InteractiveFloorMap({
  svgMarkup,
  roomBindings,
  selectedRoomId,
  onSelectRoom,
}) {
  const mapRef = useRef(null);
  const { tl } = useI18n();
  const [internalSelectedRoomId, setInternalSelectedRoomId] = useState(
    roomBindings[0]?.room.id ?? null,
  );

  const currentSelectedRoomId = selectedRoomId ?? internalSelectedRoomId;
  const selectRoom = onSelectRoom ?? setInternalSelectedRoomId;

  const bindingsBySvgId = useMemo(() => {
    return Object.fromEntries(roomBindings.map((binding) => [binding.svgId, binding]));
  }, [roomBindings]);

  const selectedBinding = useMemo(() => {
    return roomBindings.find((binding) => binding.room.id === currentSelectedRoomId) ?? null;
  }, [currentSelectedRoomId, roomBindings]);

  useEffect(() => {
    if (!roomBindings.length) {
      setInternalSelectedRoomId(null);
      return;
    }

    const fallbackRoomId = roomBindings[0].room.id;

    if (selectedRoomId === undefined) {
      setInternalSelectedRoomId((current) => {
        const selectionStillExists = roomBindings.some((binding) => binding.room.id === current);
        return selectionStillExists ? current : fallbackRoomId;
      });
      return;
    }

    const selectionStillExists = roomBindings.some((binding) => binding.room.id === selectedRoomId);
    if (!selectionStillExists) {
      selectRoom(fallbackRoomId);
    }
  }, [roomBindings, selectedRoomId, selectRoom]);

  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer) {
      return undefined;
    }

    const roomPaths = Array.from(mapContainer.querySelectorAll("g#Rooms > path[id]"));
    if (!roomPaths.length) {
      return undefined;
    }

    const removeListeners = [];

    const colorizePath = (pathElement, fillColor) => {
      pathElement.style.fill = fillColor;
      pathElement.style.transition = "fill 160ms ease";
      pathElement.style.outline = "none";
    };

    roomPaths.forEach((pathElement) => {
      const binding = bindingsBySvgId[pathElement.id];
      const isSelected = binding && binding.room.id === currentSelectedRoomId;

      colorizePath(pathElement, isSelected ? SELECTED_ROOM_COLOR : BASE_ROOM_COLOR);
      pathElement.style.cursor = binding ? "pointer" : "default";

      if (!binding) {
        return;
      }

      pathElement.setAttribute("tabindex", "0");
      pathElement.setAttribute("role", "button");
      pathElement.setAttribute(
        "aria-label",
        `Select ${tl(binding.room.name_i18n, binding.room.name)}`,
      );

      const onMouseEnter = () => {
        if (binding.room.id !== currentSelectedRoomId) {
          colorizePath(pathElement, HOVER_ROOM_COLOR);
        }
      };

      const onMouseLeave = () => {
        colorizePath(
          pathElement,
          binding.room.id === currentSelectedRoomId ? SELECTED_ROOM_COLOR : BASE_ROOM_COLOR,
        );
      };

      const onClick = () => {
        selectRoom(binding.room.id);
      };

      const onKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectRoom(binding.room.id);
        }
      };

      pathElement.addEventListener("mouseenter", onMouseEnter);
      pathElement.addEventListener("mouseleave", onMouseLeave);
      pathElement.addEventListener("click", onClick);
      pathElement.addEventListener("keydown", onKeyDown);

      removeListeners.push(() => {
        pathElement.removeEventListener("mouseenter", onMouseEnter);
        pathElement.removeEventListener("mouseleave", onMouseLeave);
        pathElement.removeEventListener("click", onClick);
        pathElement.removeEventListener("keydown", onKeyDown);
      });
    });

    return () => {
      removeListeners.forEach((remove) => remove());
    };
  }, [bindingsBySvgId, currentSelectedRoomId, selectRoom, svgMarkup, tl]);

  return (
    <div className="interactive-map-stage">
      <div
        className="interactive-map-frame"
        ref={mapRef}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
      <div className="interactive-map-caption">
        {selectedBinding ? tl(selectedBinding.room.name_i18n, selectedBinding.room.name) : ""}
      </div>
    </div>
  );
}
