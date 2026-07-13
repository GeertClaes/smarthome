"use client";

import { useI18n } from "@/app/LanguageProvider";
import { isNetworkPoint } from "@/lib/devicePoints";
import { getDeviceIcon } from "@/lib/devicePresentation";

function EditIconButton({ label, onClick }) {
  return (
    <button
      type="button"
      className="floorplan-icon-btn"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <i className="fa-solid fa-pen" aria-hidden="true" />
    </button>
  );
}

export default function FloorPlanPointList({
  points,
  devicesByMarker,
  selectedPointId,
  selectedDeviceId,
  highlightedMarkerId,
  onSelectPoint,
  onHighlightPoint,
  onSelectDevice,
  onEditPoint,
  onAddDevice,
}) {
  const { t } = useI18n();

  if (!points.length) {
    return <p className="floorplan-empty-devices">{t("floorplan.points.none")}</p>;
  }

  return (
    <ul className="floorplan-point-list">
      {points.map((point) => {
        const devicesAtPoint = devicesByMarker[point.svg_marker_id] ?? [];
        const isSelected = selectedPointId === point.id;
        const isHighlighted = highlightedMarkerId === point.svg_marker_id;
        const isEmpty = devicesAtPoint.length === 0;
        const isNetwork = isNetworkPoint(point);

        if (!isSelected) {
          return (
            <li key={point.id}>
              <button
                type="button"
                className={`floorplan-point-item ${isHighlighted ? "is-highlighted" : ""} ${isEmpty ? "is-empty" : ""} ${isNetwork ? "is-network" : ""}`}
                onClick={() => onSelectPoint(point)}
                onMouseEnter={() => onHighlightPoint(point.svg_marker_id)}
                onMouseLeave={() => onHighlightPoint(null)}
              >
                <span className="floorplan-point-copy">
                  {isEmpty ? (
                    <span className="floorplan-point-label">{t("floorplan.points.empty")}</span>
                  ) : (
                    <span className="floorplan-point-preview-list">
                      {devicesAtPoint.map((device) => (
                        <span key={device.id} className="floorplan-point-preview-device">
                          <i className={`fa-solid ${getDeviceIcon(device.device_type)}`} aria-hidden="true" />
                          <span className="floorplan-point-device-name">{device.name}</span>
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                {isEmpty ? (
                  <span className="floorplan-point-empty-icon" aria-hidden="true">
                    <i className={`fa-solid ${isNetwork ? "fa-server" : "fa-circle"}`} />
                  </span>
                ) : null}
              </button>
            </li>
          );
        }

        return (
          <li key={point.id} className="floorplan-point-card-wrap">
            <article
              className={`floorplan-point-card is-selected ${isHighlighted ? "is-highlighted" : ""} ${isNetwork ? "is-network" : ""}`}
              onMouseEnter={() => onHighlightPoint(point.svg_marker_id)}
              onMouseLeave={() => onHighlightPoint(null)}
            >
              <header className="floorplan-point-card-head">
                <button type="button" className="floorplan-point-card-select" onClick={() => onSelectPoint(point)}>
                  <span className="floorplan-point-label">{t("floorplan.inspector.devicesAtPoint")}</span>
                  {point.notes ? <span className="floorplan-point-card-note">{point.notes}</span> : null}
                </button>
                <EditIconButton label={t("floorplan.detail.editPoint")} onClick={() => onEditPoint(point)} />
              </header>

              <ul className="floorplan-point-device-list">
                {devicesAtPoint.map((device) => (
                  <li key={device.id}>
                    <button
                      type="button"
                      className={`floorplan-point-device-row ${selectedDeviceId === device.id ? "is-selected" : ""}`}
                      onClick={() => onSelectDevice(device.id)}
                    >
                      <i className={`fa-solid ${getDeviceIcon(device.device_type)}`} aria-hidden="true" />
                      <span className="floorplan-point-device-name">{device.name}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <button type="button" className="floorplan-point-add-device" onClick={onAddDevice}>
                <i className="fa-solid fa-plus" aria-hidden="true" />
                {t("floorplan.points.addDevice")}
              </button>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
