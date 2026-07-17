"use client";

import FloorPlanDeviceDetail from "./FloorPlanDeviceDetail";
import FloorPlanMarkerEditor from "./FloorPlanMarkerEditor";
import FloorPlanPointEditor from "./FloorPlanPointEditor";
import FloorPlanRoomEditor from "./FloorPlanRoomEditor";

export default function FloorPlanInspector({
  activeEditor,
  room,
  point,
  device,
  devicesAtPoint,
  deviceTypes,
  deviceModels = [],
  deviceTypeById,
  channels,
  integrationMap,
  rooms = [],
  devicePoints = [],
  registryDevices = [],
  onRoomUpdated,
  onPointUpdated,
  onDeviceSaved,
  onDeviceUpdated,
  onDeviceRemovedFromPoint,
  onChannelsSaved,
  onSelectDevice,
  onCloseEditor,
  onEditDevice,
}) {
  if (activeEditor === "room" && room) {
    return <FloorPlanRoomEditor room={room} onSaved={onRoomUpdated} onCancel={onCloseEditor} />;
  }

  if (activeEditor === "point" && point) {
    return <FloorPlanPointEditor point={point} onSaved={onPointUpdated} onCancel={onCloseEditor} />;
  }

  if ((activeEditor === "device" || activeEditor === "device-create") && point && room) {
    return (
      <FloorPlanMarkerEditor
        markerId={point.svg_marker_id}
        point={point}
        device={activeEditor === "device-create" ? null : device}
        devicesAtMarker={devicesAtPoint}
        room={room}
        rooms={rooms}
        deviceModels={deviceModels}
        devicePoints={devicePoints}
        registryDevices={registryDevices}
        channels={channels}
        onSaved={onDeviceSaved}
        onUpdated={onDeviceUpdated}
        onRemovedFromPoint={onDeviceRemovedFromPoint}
        onChannelsSaved={onChannelsSaved}
        onSelectDevice={onSelectDevice}
        onCancel={onCloseEditor}
      />
    );
  }

  return (
    <FloorPlanDeviceDetail
      device={device}
      room={room}
      point={point}
      devicePoints={devicePoints}
      deviceModels={deviceModels}
      deviceTypeById={deviceTypeById}
      channels={channels}
      integrationMap={integrationMap}
      onEdit={device && onEditDevice ? onEditDevice : undefined}
    />
  );
}
