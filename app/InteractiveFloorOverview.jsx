"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { getBuildingRoomBindings } from "@/lib/buildingRoomBindings";
import { useI18n } from "./LanguageProvider";

const IDLE_FILL = "rgba(127, 217, 196, 0.08)";
const IDLE_STROKE = "rgba(127, 217, 196, 0.28)";

const HOVER_FILL = "rgba(127, 217, 196, 0.32)";
const HOVER_STROKE = "#7fd9c4";

const SELECTED_FILL = "rgba(11, 138, 128, 0.55)";
const SELECTED_STROKE = "#9aebd8";

function applyShapeStyle(shapeElement, fill, stroke, strokeWidth = 1.5) {
  shapeElement.style.fill = fill;
  shapeElement.style.stroke = stroke;
  shapeElement.style.strokeWidth = `${strokeWidth}px`;
  shapeElement.style.transition = "fill 160ms ease, stroke 160ms ease";
  shapeElement.style.cursor = "pointer";
  shapeElement.style.outline = "none";
}

export default function InteractiveFloorOverview({
  floorId,
  floorImage,
  floorLabel = "",
  overlaySvg,
  rooms = [],
  selectedRoomId,
  onSelectRoom,
}) {
  const mapRef = useRef(null);
  const { t, tl } = useI18n();

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
    const mapContainer = mapRef.current;
    if (!mapContainer || !overlaySvg) {
      return undefined;
    }

    const shapes = Array.from(mapContainer.querySelectorAll("g#Rooms > [id]"));
    if (!shapes.length) {
      return undefined;
    }

    const removeListeners = [];

    shapes.forEach((shapeElement) => {
      const binding = bindingsBySvgId[shapeElement.id];
      if (!binding?.room) {
        shapeElement.style.pointerEvents = "none";
        shapeElement.style.fill = "transparent";
        shapeElement.style.stroke = "transparent";
        return;
      }

      const isSelected = binding.room.id === selectedRoomId;
      applyShapeStyle(
        shapeElement,
        isSelected ? SELECTED_FILL : IDLE_FILL,
        isSelected ? SELECTED_STROKE : IDLE_STROKE,
        isSelected ? 2.25 : 1.5,
      );

      shapeElement.setAttribute("tabindex", "0");
      shapeElement.setAttribute("role", "button");
      shapeElement.setAttribute(
        "aria-label",
        t("home.selectRoom", { room: tl(binding.room.name_i18n, binding.room.name) }),
      );
      shapeElement.setAttribute("aria-pressed", isSelected ? "true" : "false");

      const onMouseEnter = () => {
        if (binding.room.id !== selectedRoomId) {
          applyShapeStyle(shapeElement, HOVER_FILL, HOVER_STROKE, 2);
        }
      };

      const onMouseLeave = () => {
        if (binding.room.id === selectedRoomId) {
          applyShapeStyle(shapeElement, SELECTED_FILL, SELECTED_STROKE, 2.25);
        } else {
          applyShapeStyle(shapeElement, IDLE_FILL, IDLE_STROKE, 1.5);
        }
      };

      const onClick = () => {
        onSelectRoom?.(binding.room.id);
      };

      const onKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectRoom?.(binding.room.id);
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
      removeListeners.forEach((remove) => remove());
    };
  }, [bindingsBySvgId, onSelectRoom, overlaySvg, selectedRoomId, t, tl]);

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
      {overlaySvg ? (
        <div
          className="building-floor-overlay"
          ref={mapRef}
          dangerouslySetInnerHTML={{ __html: overlaySvg }}
        />
      ) : null}
    </div>
  );
}
