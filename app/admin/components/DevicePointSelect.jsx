"use client";

import { useI18n } from "@/app/LanguageProvider";

export default function DevicePointSelect({ value, onChange, devicePoints = [], rooms = [], roomId }) {
  const { tl } = useI18n();
  const roomById = Object.fromEntries(rooms.map((room) => [room.id, room]));

  const pointsForRoom = devicePoints.filter((point) => !roomId || point.room_id === roomId);
  const otherPoints = roomId ? devicePoints.filter((point) => point.room_id !== roomId) : [];

  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">No floor plan point</option>
      {pointsForRoom.length ? (
        <optgroup label={roomId ? tl(roomById[roomId]?.name_i18n, roomById[roomId]?.name ?? "This room") : "Points"}>
          {pointsForRoom.map((point) => (
            <option key={point.id} value={point.svg_marker_id}>
              {point.svg_marker_id}
            </option>
          ))}
        </optgroup>
      ) : null}
      {otherPoints.length ? (
        <optgroup label="Other rooms">
          {otherPoints.map((point) => (
            <option key={point.id} value={point.svg_marker_id}>
              {point.svg_marker_id} — {tl(roomById[point.room_id]?.name_i18n, roomById[point.room_id]?.name ?? point.room_id)}
            </option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
}
