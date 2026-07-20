"use client";

import { useI18n } from "./LanguageProvider";

export default function BuildingAreaList({
  areas,
  selectedRoomId,
  highlightedRoomId,
  onSelectRoom,
  onHighlightRoom,
}) {
  const { t, tl } = useI18n();

  if (!areas?.length) {
    return null;
  }

  return (
    <aside className="building-area-list" aria-label={t("home.areasLabel")}>
      <p className="building-area-list-title">{t("home.areasLabel")}</p>
      <ul className="building-area-list-items">
        {areas.map((area) => {
          const isSelected = area.room.id === selectedRoomId;
          const isHighlighted = area.room.id === highlightedRoomId;

          return (
            <li key={area.room.id}>
              <button
                type="button"
                className={`building-area-item ${isSelected ? "is-selected" : ""} ${isHighlighted ? "is-highlighted" : ""}`}
                aria-pressed={isSelected}
                onClick={() => onSelectRoom?.(area.room.id)}
                onMouseEnter={() => onHighlightRoom?.(area.room.id)}
                onMouseLeave={() => onHighlightRoom?.(null)}
                onFocus={() => onHighlightRoom?.(area.room.id)}
                onBlur={() => onHighlightRoom?.(null)}
              >
                <span
                  className="building-area-swatch"
                  style={{
                    backgroundColor: area.color,
                    borderColor: area.stroke ?? area.color,
                  }}
                  aria-hidden="true"
                />
                <span className="building-area-label">{tl(area.room.name_i18n, area.room.name)}</span>
                {area.room.images?.length ? (
                  <span className="building-area-photo-count" aria-label={t("home.areaPhotoCount", { count: area.room.images.length })}>
                    <i className="fa-solid fa-camera" aria-hidden="true" />
                    {area.room.images.length}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
