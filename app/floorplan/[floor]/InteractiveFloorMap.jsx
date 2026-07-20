"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/app/LanguageProvider";
import { getRoomDeviceGroupId } from "@/lib/floorplanMarkers";

const BASE_ROOM_COLOR = "#BEEDE4";
const HOVER_ROOM_COLOR = "#7FD9C4";
const SELECTED_ROOM_COLOR = "#0B8A80";

const MARKER_BASE = "#0b8a80";
const MARKER_SELECTED = "#9aebd8";
const MARKER_STROKE = "#7fd9c4";
const MARKER_STROKE_SELECTED = "#ceede5";
const MARKER_EMPTY = "rgba(127, 217, 196, 0.18)";
const MARKER_EMPTY_STROKE = "rgba(127, 217, 196, 0.42)";

const NETWORK_MARKER_BASE = "#6366f1";
const NETWORK_MARKER_SELECTED = "#c7d2fe";
const NETWORK_MARKER_STROKE = "#818cf8";
const NETWORK_MARKER_STROKE_SELECTED = "#e0e7ff";
const NETWORK_MARKER_EMPTY = "rgba(99, 102, 241, 0.16)";
const NETWORK_MARKER_EMPTY_STROKE = "rgba(99, 102, 241, 0.42)";

function getMarkerCenter(element) {
  if (element.tagName === "circle") {
    return {
      x: Number.parseFloat(element.getAttribute("cx") ?? "0"),
      y: Number.parseFloat(element.getAttribute("cy") ?? "0"),
    };
  }

  if (element.tagName === "rect") {
    const x = Number.parseFloat(element.getAttribute("x") ?? "0");
    const y = Number.parseFloat(element.getAttribute("y") ?? "0");
    const width = Number.parseFloat(element.getAttribute("width") ?? "0");
    const height = Number.parseFloat(element.getAttribute("height") ?? "0");

    return {
      x: x + width / 2,
      y: y + height / 2,
    };
  }

  const box = element.getBBox();
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

function getMarkerPalette(isNetwork, hasDevices, { selected = false, hovered = false } = {}) {
  if (isNetwork) {
    if (selected) {
      return {
        fill: hasDevices ? NETWORK_MARKER_SELECTED : NETWORK_MARKER_EMPTY,
        stroke: NETWORK_MARKER_STROKE_SELECTED,
        scale: hovered ? 1.18 : 1.14,
        strokeWidth: "4px",
      };
    }

    if (hovered) {
      return {
        fill: hasDevices ? NETWORK_MARKER_SELECTED : NETWORK_MARKER_EMPTY,
        stroke: NETWORK_MARKER_STROKE_SELECTED,
        scale: 1.08,
        strokeWidth: "3px",
      };
    }

    return {
      fill: hasDevices ? NETWORK_MARKER_BASE : NETWORK_MARKER_EMPTY,
      stroke: hasDevices ? NETWORK_MARKER_STROKE : NETWORK_MARKER_EMPTY_STROKE,
      scale: 1,
      strokeWidth: "3px",
    };
  }

  if (selected) {
    return {
      fill: hasDevices ? MARKER_SELECTED : MARKER_EMPTY,
      stroke: MARKER_STROKE_SELECTED,
      scale: hovered ? 1.18 : 1.14,
      strokeWidth: "4px",
    };
  }

  if (hovered) {
    return {
      fill: hasDevices ? MARKER_SELECTED : MARKER_EMPTY,
      stroke: MARKER_STROKE_SELECTED,
      scale: 1.08,
      strokeWidth: "3px",
    };
  }

  return {
    fill: hasDevices ? MARKER_BASE : MARKER_EMPTY,
    stroke: hasDevices ? MARKER_STROKE : MARKER_EMPTY_STROKE,
    scale: 1,
    strokeWidth: "3px",
  };
}

function styleMarker(element, fill, stroke, scale = 1, strokeWidth = "3px") {
  element.style.fill = fill;
  element.style.stroke = stroke;
  element.style.strokeWidth = strokeWidth;
  element.style.transition = "fill 160ms ease, stroke 160ms ease, transform 160ms ease";
  element.style.transformOrigin = "center";
  element.style.transformBox = "fill-box";
  element.style.transform = scale === 1 ? "" : `scale(${scale})`;
}

export default function InteractiveFloorMap({
  svgMarkup,
  roomBindings,
  selectedRoomId,
  selectedRoomSvgId,
  devicesByMarker,
  selectedMarkerId,
  highlightedMarkerId,
  networkMarkerIds = [],
  showAllMarkers = false,
  editMode = false,
  onSelectRoom,
  onHighlightMarker,
  onSelectMarker,
}) {
  const mapRef = useRef(null);
  const svgHostRef = useRef(null);
  const svgMarkupRef = useRef("");
  const markerElementsRef = useRef(new Map());
  const [svgVersion, setSvgVersion] = useState(0);
  const { tl } = useI18n();
  const networkMarkerIdSet = useMemo(() => new Set(networkMarkerIds), [networkMarkerIds]);
  const [internalSelectedRoomId, setInternalSelectedRoomId] = useState(
    roomBindings[0]?.room.id ?? null,
  );

  const currentSelectedRoomId = selectedRoomId ?? internalSelectedRoomId;
  const selectRoom = onSelectRoom ?? setInternalSelectedRoomId;
  const highlightMarker = onHighlightMarker ?? (() => {});

  const bindingsBySvgId = useMemo(() => {
    return Object.fromEntries(roomBindings.map((binding) => [binding.svgId, binding]));
  }, [roomBindings]);

  const activeDeviceGroupId = selectedRoomSvgId ? getRoomDeviceGroupId(selectedRoomSvgId) : null;

  useEffect(() => {
    const host = svgHostRef.current;
    if (!host || !svgMarkup || svgMarkupRef.current === svgMarkup) {
      return;
    }

    host.innerHTML = svgMarkup;
    svgMarkupRef.current = svgMarkup;

    // Decorative walls/doors sit above room fills in the SVG and would steal clicks
    // (e.g. decorative frames over room shapes). Keep only Rooms + Points interactive.
    const background = host.querySelector("#Background");
    if (background) {
      background.style.pointerEvents = "none";
    }
    host.querySelectorAll("#FloorMap > path").forEach((pathElement) => {
      pathElement.style.pointerEvents = "none";
    });

    setSvgVersion((version) => version + 1);
  }, [svgMarkup]);

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
  }, [bindingsBySvgId, currentSelectedRoomId, selectRoom, svgVersion, tl]);

  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer) {
      return undefined;
    }

    const removeListeners = [];
    const badgeNodes = [];
    markerElementsRef.current = new Map();

    mapContainer.querySelectorAll('g[id^="points_"]').forEach((group) => {
      group.style.display = showAllMarkers || group.id === activeDeviceGroupId ? "" : "none";
    });

    mapContainer.querySelectorAll("text[data-marker-badge]").forEach((node) => node.remove());

    const groupsToProcess = showAllMarkers
      ? Array.from(mapContainer.querySelectorAll('g[id^="points_"]'))
      : activeDeviceGroupId
        ? [mapContainer.querySelector(`#${activeDeviceGroupId}`)].filter(Boolean)
        : [];

    if (!groupsToProcess.length) {
      return undefined;
    }

    groupsToProcess.forEach((activeGroup) => {
      const markerElements = Array.from(activeGroup.querySelectorAll("[id]")).filter(
        (element) => element.id && element !== activeGroup,
      );

      markerElements.forEach((markerElement) => {
      const markerId = markerElement.id;
      const devicesAtMarker = devicesByMarker?.[markerId] ?? [];
      const hasDevices = devicesAtMarker.length > 0;
      const isNetwork = networkMarkerIdSet.has(markerId);

      if (!hasDevices && !showAllMarkers && !editMode) {
        markerElement.style.display = "none";
        markerElement.style.cursor = "default";
        markerElement.removeAttribute("tabindex");
        return;
      }

      markerElement.style.display = "";
      markerElementsRef.current.set(markerId, markerElement);
      markerElement.style.cursor = "pointer";
      markerElement.setAttribute("tabindex", "0");
      markerElement.setAttribute("role", "button");

      const label = hasDevices
        ? devicesAtMarker.length > 1
          ? `${devicesAtMarker.length} devices`
          : devicesAtMarker[0].name
        : editMode
          ? `Add device at ${markerId}`
          : markerId;
      markerElement.setAttribute("data-marker-kind", isNetwork ? "network" : "device");
      markerElement.setAttribute("aria-label", label);

      if (devicesAtMarker.length > 1) {
        const { x, y } = getMarkerCenter(markerElement);
        const badge = document.createElementNS("http://www.w3.org/2000/svg", "text");
        badge.setAttribute("data-marker-badge", markerId);
        badge.setAttribute("x", String(x));
        badge.setAttribute("y", String(y));
        badge.setAttribute("text-anchor", "middle");
        badge.setAttribute("dominant-baseline", "central");
        badge.setAttribute("fill", "#0a1018");
        badge.setAttribute("font-size", "11");
        badge.setAttribute("font-weight", "700");
        badge.setAttribute("pointer-events", "none");
        badge.textContent = String(devicesAtMarker.length);
        activeGroup.appendChild(badge);
        badgeNodes.push(badge);
      }

      const onMouseEnter = () => highlightMarker(markerId);
      const onMouseLeave = () => highlightMarker(null);
      const onClick = () => {
        highlightMarker(markerId);
        onSelectMarker?.(markerId);
      };
      const onKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          highlightMarker(markerId);
          onSelectMarker?.(markerId);
        }
      };

      markerElement.addEventListener("mouseenter", onMouseEnter);
      markerElement.addEventListener("mouseleave", onMouseLeave);
      markerElement.addEventListener("click", onClick);
      markerElement.addEventListener("keydown", onKeyDown);

      removeListeners.push(() => {
        markerElement.removeEventListener("mouseenter", onMouseEnter);
        markerElement.removeEventListener("mouseleave", onMouseLeave);
        markerElement.removeEventListener("click", onClick);
        markerElement.removeEventListener("keydown", onKeyDown);
      });

      const palette = getMarkerPalette(isNetwork, hasDevices, { selected: false, hovered: false });
      styleMarker(markerElement, palette.fill, palette.stroke, palette.scale, palette.strokeWidth);
      markerElement.style.strokeDasharray = hasDevices ? "" : "5 4";
      });
    });

    return () => {
      removeListeners.forEach((remove) => remove());
      badgeNodes.forEach((node) => node.remove());
      markerElementsRef.current = new Map();
    };
  }, [
    activeDeviceGroupId,
    devicesByMarker,
    editMode,
    highlightMarker,
    networkMarkerIdSet,
    onSelectMarker,
    showAllMarkers,
    svgVersion,
  ]);

  useEffect(() => {
    markerElementsRef.current.forEach((markerElement, markerId) => {
      const hasDevices = (devicesByMarker?.[markerId] ?? []).length > 0;
      const isSelected = selectedMarkerId === markerId;
      const isHovered = highlightedMarkerId === markerId;
      const isNetwork = networkMarkerIdSet.has(markerId);
      const palette = getMarkerPalette(isNetwork, hasDevices, { selected: isSelected, hovered: isHovered });

      styleMarker(markerElement, palette.fill, palette.stroke, palette.scale, palette.strokeWidth);
      markerElement.style.strokeDasharray = hasDevices ? "" : "5 4";
      markerElement.classList.toggle("floorplan-marker-selected", isSelected);
      markerElement.classList.toggle("floorplan-marker-hovered", isHovered && !isSelected);
      markerElement.setAttribute("aria-current", isSelected ? "true" : "false");
    });
  }, [highlightedMarkerId, selectedMarkerId, activeDeviceGroupId, devicesByMarker, networkMarkerIdSet]);

  return (
    <div className="floorplan-map-frame" ref={mapRef}>
      <div className="floorplan-map-svg-host" ref={svgHostRef} />
    </div>
  );
}
