"use client";

import { useEffect, useMemo, useRef } from "react";
import { useI18n } from "./LanguageProvider";

const INACTIVE_FILL = "#1a2838";
const INACTIVE_STROKE = "rgba(120, 145, 170, 0.18)";

const AVAILABLE_FILL = "rgba(11, 138, 128, 0.28)";
const AVAILABLE_STROKE = "rgba(127, 217, 196, 0.45)";

const HOVER_FILL = "rgba(127, 217, 196, 0.42)";
const HOVER_STROKE = "#7fd9c4";

const SELECTED_FILL = "#0b8a80";
const SELECTED_STROKE = "#9aebd8";

const FLOOR_SVG_BINDINGS = [
  { svgId: "Penthouse", floorId: null },
  { svgId: "SecondFloor", floorId: null },
  { svgId: "FirstFloor", floorId: null },
  { svgId: "GroundFloor", floorId: "ground_floor" },
  { svgId: "Basement", floorId: "basement" },
];

function applyShapeStyle(shapeElement, fill, stroke, strokeWidth = 1.5) {
  shapeElement.style.fill = fill;
  shapeElement.style.stroke = stroke;
  shapeElement.style.strokeWidth = `${strokeWidth}px`;
  shapeElement.style.transition = "fill 160ms ease, stroke 160ms ease";
  shapeElement.style.outline = "none";
}

export default function InteractiveBuildingMap({
  svgMarkup,
  floors,
  selectedFloorId,
  onSelectFloor,
}) {
  const mapRef = useRef(null);
  const { tl } = useI18n();

  const bindingsBySvgId = useMemo(() => {
    const floorById = Object.fromEntries(floors.map((floor) => [floor.id, floor]));

    return Object.fromEntries(
      FLOOR_SVG_BINDINGS.map((binding) => {
        const floor = binding.floorId ? floorById[binding.floorId] : null;
        return [binding.svgId, floor ? { ...binding, floor } : { ...binding, floor: null }];
      }),
    );
  }, [floors]);

  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer) {
      return undefined;
    }

    const floorShapes = Array.from(mapContainer.querySelectorAll("g#Rooms > [id]"));
    if (!floorShapes.length) {
      return undefined;
    }

    const removeListeners = [];

    floorShapes.forEach((shapeElement) => {
      const binding = bindingsBySvgId[shapeElement.id];
      const isInteractive = Boolean(binding?.floor);
      const isSelected = isInteractive && binding.floor.id === selectedFloorId;

      if (isSelected) {
        applyShapeStyle(shapeElement, SELECTED_FILL, SELECTED_STROKE, 2);
      } else if (isInteractive) {
        applyShapeStyle(shapeElement, AVAILABLE_FILL, AVAILABLE_STROKE);
      } else {
        applyShapeStyle(shapeElement, INACTIVE_FILL, INACTIVE_STROKE, 1);
      }

      shapeElement.style.cursor = isInteractive ? "pointer" : "default";

      if (!isInteractive) {
        return;
      }

      shapeElement.setAttribute("tabindex", "0");
      shapeElement.setAttribute("role", "button");
      shapeElement.setAttribute(
        "aria-label",
        `Select ${tl(binding.floor.name_i18n, binding.floor.name)}`,
      );
      shapeElement.setAttribute(
        "aria-pressed",
        binding.floor.id === selectedFloorId ? "true" : "false",
      );

      const onMouseEnter = () => {
        if (binding.floor.id !== selectedFloorId) {
          applyShapeStyle(shapeElement, HOVER_FILL, HOVER_STROKE, 2);
        }
      };

      const onMouseLeave = () => {
        if (binding.floor.id === selectedFloorId) {
          applyShapeStyle(shapeElement, SELECTED_FILL, SELECTED_STROKE, 2);
        } else {
          applyShapeStyle(shapeElement, AVAILABLE_FILL, AVAILABLE_STROKE);
        }
      };

      const onClick = () => {
        onSelectFloor(binding.floor.id);
      };

      const onKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectFloor(binding.floor.id);
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
  }, [bindingsBySvgId, onSelectFloor, selectedFloorId, svgMarkup, tl]);

  if (!svgMarkup) {
    return <div className="alert alert-warning">Building diagram is missing.</div>;
  }

  return (
    <div
      className="building-level-map-frame"
      ref={mapRef}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
