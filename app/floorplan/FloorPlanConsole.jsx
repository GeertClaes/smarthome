"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/app/LanguageProvider";
import { buildRoomDevicePoints, buildNetworkMarkerIdSet } from "@/lib/devicePoints";
import { groupDevicesByMarker } from "@/lib/floorplanMarkers";
import FloorPlanInspector from "./FloorPlanInspector";
import FloorPlanPhotoStrip from "./FloorPlanPhotoStrip";
import FloorPlanPointList from "./FloorPlanPointList";
import InteractiveFloorMap from "./[floor]/InteractiveFloorMap";

const DEFAULT_ROOM_ID = "living_dining";

export default function FloorPlanConsole({
  roomBindings,
  devices,
  registryDevices = [],
  deviceTypes,
  deviceModels = [],
  channels,
  integrations,
  svgMarkup,
  devicePointsRegistry,
}) {
  const router = useRouter();
  const { t, tl } = useI18n();
  const [localDevices, setLocalDevices] = useState(devices);
  const [localPoints, setLocalPoints] = useState(devicePointsRegistry);
  const [localRooms, setLocalRooms] = useState(() => roomBindings.map((binding) => binding.room));
  const [localChannels, setLocalChannels] = useState(channels);
  const [selectedRoomId, setSelectedRoomId] = useState(DEFAULT_ROOM_ID);
  const [selectedPointId, setSelectedPointId] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const [activeEditor, setActiveEditor] = useState(null);

  useEffect(() => {
    setLocalDevices(devices);
  }, [devices]);

  useEffect(() => {
    setLocalPoints(devicePointsRegistry);
  }, [devicePointsRegistry]);

  useEffect(() => {
    setLocalRooms(roomBindings.map((binding) => binding.room));
  }, [roomBindings]);

  useEffect(() => {
    setLocalChannels(channels);
  }, [channels]);

  const deviceTypeNames = useMemo(() => deviceTypes.map((type) => type.name), [deviceTypes]);

  const floorPlanPoints = useMemo(() => {
    const roomIds = new Set(roomBindings.map((binding) => binding.room.id));
    return localPoints.filter((point) => roomIds.has(point.room_id));
  }, [localPoints, roomBindings]);

  const networkMarkerIds = useMemo(() => {
    return [...buildNetworkMarkerIdSet(localPoints)];
  }, [localPoints]);

  const adminRooms = useMemo(() => roomBindings.map((binding) => binding.room), [roomBindings]);

  const selectedBinding = useMemo(() => {
    const room =
      roomBindings.find((binding) => binding.room.id === selectedRoomId)?.room ??
      roomBindings.find((binding) => binding.room.id === DEFAULT_ROOM_ID)?.room ??
      roomBindings[0]?.room ??
      null;

    if (!room) {
      return null;
    }

    const svgId = roomBindings.find((binding) => binding.room.id === room.id)?.svgId ?? null;

    return { room, svgId };
  }, [roomBindings, selectedRoomId]);

  const currentRoom = useMemo(() => {
    return localRooms.find((room) => room.id === selectedBinding?.room.id) ?? selectedBinding?.room ?? null;
  }, [localRooms, selectedBinding]);

  const floorDevices = useMemo(() => {
    const roomIds = new Set(roomBindings.map((binding) => binding.room.id));
    return localDevices
      .filter((device) => roomIds.has(device.installed_room_id))
      .toSorted((a, b) => a.name.localeCompare(b.name));
  }, [localDevices, roomBindings]);

  const deviceTypeById = useMemo(() => {
    return Object.fromEntries((deviceTypes ?? []).map((deviceType) => [deviceType.id, deviceType]));
  }, [deviceTypes]);

  const integrationMap = useMemo(() => {
    return Object.fromEntries((integrations ?? []).map((item) => [item.channel_id, item]));
  }, [integrations]);

  const roomPoints = useMemo(() => {
    if (!selectedBinding?.room.id || !selectedBinding.svgId) {
      return [];
    }

    return buildRoomDevicePoints({
      roomId: selectedBinding.room.id,
      roomSvgId: selectedBinding.svgId,
      svgMarkup,
      registry: localPoints,
    });
  }, [localPoints, selectedBinding, svgMarkup]);

  const allDevicesByMarker = useMemo(() => {
    return groupDevicesByMarker(floorDevices);
  }, [floorDevices]);

  const markerIndex = useMemo(() => {
    const index = new Map();

    for (const binding of roomBindings) {
      if (!binding.svgId) {
        continue;
      }

      const points = buildRoomDevicePoints({
        roomId: binding.room.id,
        roomSvgId: binding.svgId,
        svgMarkup,
        registry: localPoints,
      });

      for (const point of points) {
        index.set(point.svg_marker_id, {
          roomId: binding.room.id,
          point,
        });
      }
    }

    return index;
  }, [localPoints, roomBindings, svgMarkup]);

  const selectedRoomDevices = useMemo(() => {
    return floorDevices.filter((device) => device.installed_room_id === selectedBinding?.room.id);
  }, [floorDevices, selectedBinding]);

  const devicesByMarker = useMemo(() => {
    return groupDevicesByMarker(selectedRoomDevices);
  }, [selectedRoomDevices]);

  const selectedPoint = useMemo(() => {
    return roomPoints.find((point) => point.id === selectedPointId) ?? null;
  }, [roomPoints, selectedPointId]);

  const devicesAtSelectedPoint = selectedPoint
    ? (devicesByMarker[selectedPoint.svg_marker_id] ?? [])
    : [];

  const selectedDevice = useMemo(() => {
    return floorDevices.find((device) => device.id === selectedDeviceId) ?? null;
  }, [floorDevices, selectedDeviceId]);

  const selectedDeviceRoom = useMemo(() => {
    if (!selectedDevice) {
      return currentRoom;
    }

    return (
      localRooms.find((room) => room.id === selectedDevice.installed_room_id) ??
      roomBindings.find((binding) => binding.room.id === selectedDevice.installed_room_id)?.room ??
      currentRoom
    );
  }, [currentRoom, localRooms, roomBindings, selectedDevice]);

  useEffect(() => {
    if (!roomPoints.length) {
      setSelectedPointId(null);
      return;
    }

    setSelectedPointId((current) => {
      const stillExists = roomPoints.some((point) => point.id === current);
      return stillExists ? current : roomPoints[0].id;
    });
  }, [roomPoints]);

  useEffect(() => {
    if (!devicesAtSelectedPoint.length) {
      setSelectedDeviceId(null);
      return;
    }

    setSelectedDeviceId((current) => {
      const stillExists = devicesAtSelectedPoint.some((device) => device.id === current);
      return stillExists ? current : devicesAtSelectedPoint[0].id;
    });
  }, [devicesAtSelectedPoint]);

  const selectedMarkerId = selectedPoint?.svg_marker_id ?? null;

  function closeEditor() {
    setActiveEditor(null);
  }

  function selectPoint(point) {
    setSelectedPointId(point.id);
    closeEditor();

    const devicesAtPoint = devicesByMarker[point.svg_marker_id] ?? [];
    setSelectedDeviceId(devicesAtPoint[0]?.id ?? null);
  }

  function handleSelectMarker(svgMarkerId) {
    const entry = markerIndex.get(svgMarkerId);
    if (!entry) {
      return;
    }

    const roomDevices = floorDevices.filter((device) => device.installed_room_id === entry.roomId);
    const markerDevices = groupDevicesByMarker(roomDevices)[svgMarkerId] ?? [];

    setSelectedRoomId(entry.roomId);
    setSelectedPointId(entry.point.id);
    setSelectedDeviceId(markerDevices[0]?.id ?? null);
    closeEditor();
  }

  function handleDeviceSaved(savedDevice) {
    setLocalDevices((current) => {
      const index = current.findIndex((entry) => entry.id === savedDevice.id);
      if (index === -1) {
        return [...current, savedDevice].toSorted((a, b) => a.name.localeCompare(b.name));
      }

      const next = [...current];
      next[index] = savedDevice;
      return next;
    });
    setSelectedDeviceId(savedDevice.id);
    closeEditor();
    router.refresh();
  }

  function handleDeviceUpdated(savedDevice) {
    setLocalDevices((current) => {
      const index = current.findIndex((entry) => entry.id === savedDevice.id);
      if (index === -1) {
        return [...current, savedDevice].toSorted((a, b) => a.name.localeCompare(b.name));
      }

      const next = [...current];
      next[index] = savedDevice;
      return next;
    });
  }

  function handleDeviceRemovedFromPoint(savedDevice) {
    setLocalDevices((current) => {
      const index = current.findIndex((entry) => entry.id === savedDevice.id);
      if (index === -1) {
        return [...current, savedDevice].toSorted((a, b) => a.name.localeCompare(b.name));
      }

      const next = [...current];
      next[index] = savedDevice;
      return next;
    });
    setSelectedDeviceId(null);
    closeEditor();
    router.refresh();
  }

  function handlePointUpdated(point) {
    setLocalPoints((current) => {
      const index = current.findIndex((entry) => entry.id === point.id);
      if (index === -1) {
        return [...current, point];
      }

      const next = [...current];
      next[index] = point;
      return next;
    });
  }

  function handleRoomUpdated(room) {
    setLocalRooms((current) => current.map((entry) => (entry.id === room.id ? room : entry)));
    router.refresh();
  }

  function handleChannelsSaved(deviceId, savedChannels) {
    setLocalChannels((current) => [
      ...current.filter((channel) => channel.device_id !== deviceId),
      ...savedChannels,
    ]);
  }

  return (
    <div className="floorplan-page">
      <header className="floorplan-head">
        <div className="floorplan-head-row">
          <div>
            <p className="section-kicker">{t("floorplan.title")}</p>
            <div className="floorplan-room-title-row">
              <h1 className="floorplan-room-title">
                {currentRoom ? tl(currentRoom.name_i18n, currentRoom.name) : t("floorplan.emptyState")}
              </h1>
              {currentRoom ? (
                <button
                  type="button"
                  className="floorplan-icon-btn floorplan-room-edit-btn"
                  aria-label={t("floorplan.detail.editRoom")}
                  onClick={() => setActiveEditor("room")}
                >
                  <i className="fa-solid fa-pen" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            {currentRoom ? (
              <p className="floorplan-room-summary">
                {t("floorplan.points.summary", {
                  points: roomPoints.length,
                  devices: selectedRoomDevices.length,
                })}
              </p>
            ) : null}
            <p className="floorplan-hint">{t("floorplan.points.subtitle")}</p>
          </div>
        </div>
      </header>

      <div className="floorplan-workspace">
        <div className="floorplan-map-panel">
          {svgMarkup ? (
            <InteractiveFloorMap
              svgMarkup={svgMarkup}
              roomBindings={roomBindings}
              selectedRoomId={selectedBinding?.room.id ?? null}
              selectedRoomSvgId={selectedBinding?.svgId ?? null}
              devicesByMarker={allDevicesByMarker}
              selectedMarkerId={selectedMarkerId}
              highlightedMarkerId={hoveredMarkerId}
              networkMarkerIds={networkMarkerIds}
              showAllMarkers
              editMode={Boolean(activeEditor)}
              onSelectRoom={(roomId) => {
                setSelectedRoomId(roomId);
                setSelectedDeviceId(null);
                closeEditor();
              }}
              onHighlightMarker={setHoveredMarkerId}
              onSelectMarker={handleSelectMarker}
            />
          ) : (
            <div className="alert alert-warning">Interactive SVG map is missing.</div>
          )}
          <p className="floorplan-map-legend" aria-hidden="true">
            <span className="floorplan-legend-item">
              <span className="floorplan-legend-shape floorplan-legend-shape--device" />
              {t("floorplan.legend.device")}
            </span>
            <span className="floorplan-legend-item">
              <span className="floorplan-legend-shape floorplan-legend-shape--network" />
              {t("floorplan.legend.network")}
            </span>
            <span className="floorplan-legend-item">
              <span className="floorplan-legend-shape floorplan-legend-shape--selected" />
              {t("floorplan.legend.selected")}
            </span>
          </p>
        </div>

        <div className="content-divider" aria-hidden="true" />

        <nav className="floorplan-device-list-panel" aria-label={t("floorplan.points.title")}>
          <p className="floorplan-point-list-title">{t("floorplan.points.title")}</p>
          <FloorPlanPointList
            points={roomPoints}
            devicesByMarker={devicesByMarker}
            selectedPointId={selectedPointId}
            selectedDeviceId={selectedDeviceId}
            highlightedMarkerId={hoveredMarkerId}
            onSelectPoint={selectPoint}
            onHighlightPoint={setHoveredMarkerId}
            onSelectDevice={(deviceId) => {
              setSelectedDeviceId(deviceId);
              closeEditor();
            }}
            onEditPoint={() => setActiveEditor("point")}
            onAddDevice={() => {
              setSelectedDeviceId(null);
              setActiveEditor("device-create");
            }}
          />
        </nav>

        <div className="content-divider" aria-hidden="true" />

        <div className="floorplan-detail-panel">
          <FloorPlanInspector
            activeEditor={activeEditor}
            room={selectedDeviceRoom}
            point={selectedPoint}
            device={selectedDevice}
            devicesAtPoint={devicesAtSelectedPoint}
            deviceTypes={deviceTypeNames}
            deviceModels={deviceModels}
            deviceTypeById={deviceTypeById}
            channels={localChannels}
            integrationMap={integrationMap}
            rooms={adminRooms}
            devicePoints={floorPlanPoints}
            registryDevices={registryDevices.length ? registryDevices : localDevices}
            onRoomUpdated={handleRoomUpdated}
            onPointUpdated={handlePointUpdated}
            onDeviceSaved={handleDeviceSaved}
            onDeviceUpdated={handleDeviceUpdated}
            onDeviceRemovedFromPoint={handleDeviceRemovedFromPoint}
            onChannelsSaved={handleChannelsSaved}
            onSelectDevice={(deviceId) => {
              setSelectedDeviceId(deviceId);
              setActiveEditor("device");
            }}
            onCloseEditor={closeEditor}
            onEditDevice={() => {
              if (selectedDevice) {
                setActiveEditor("device");
              }
            }}
          />
        </div>
      </div>

      {!activeEditor ? (
        <FloorPlanPhotoStrip device={selectedDevice} point={selectedPoint} room={selectedDeviceRoom} />
      ) : null}
    </div>
  );
}
