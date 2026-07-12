"use client";

import { useI18n } from "@/app/LanguageProvider";
import { getDeviceIcon, toDeviceTypeKey } from "@/lib/devicePresentation";
import { findDeviceModelByName } from "@/lib/deviceModels";
import { getDevicePointLabel } from "@/lib/devicePoints";

export default function FloorPlanDeviceDetail({
  device,
  room,
  point,
  devicePoints = [],
  deviceModels = [],
  deviceTypeById,
  channels,
  integrationMap,
  onEdit,
}) {
  const { t, tl } = useI18n();

  if (!device) {
    return (
      <div className="floorplan-device-detail is-empty">
        <p>{t("floorplan.selectDevice")}</p>
      </div>
    );
  }

  const typeKey = toDeviceTypeKey(device.device_type);
  const mappedPoint =
    point ??
    (device.floorplan_marker_id
      ? devicePoints.find((entry) => entry.svg_marker_id === device.floorplan_marker_id)
      : null);
  const pointLabel = mappedPoint ? getDevicePointLabel(mappedPoint, tl) : null;
  const catalogModel = findDeviceModelByName(deviceModels, device.model);
  const deviceChannels = channels.filter((channel) => channel.device_id === device.id);

  return (
    <div className="floorplan-device-detail">
      <div className="floorplan-detail-head">
        <div className="floorplan-detail-icon" aria-hidden="true">
          <i className={`fa-solid ${getDeviceIcon(device.device_type)}`} />
        </div>
        <div className="floorplan-detail-head-copy">
          <div className="floorplan-detail-title-row">
            <div className="floorplan-detail-title-group">
              <h2 className="floorplan-detail-title">{device.name}</h2>
              <p className="floorplan-detail-type">
                {device.model || tl(deviceTypeById[typeKey]?.name_i18n, device.device_type)}
              </p>
            </div>
            <div className="floorplan-detail-title-actions">
              {onEdit ? (
                <button
                  type="button"
                  className="floorplan-icon-btn"
                  aria-label={t("floorplan.detail.edit")}
                  onClick={onEdit}
                >
                  <i className="fa-solid fa-pen" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <dl className="floorplan-detail-grid">
        <div>
          <dt>{t("floorplan.detail.point")}</dt>
          <dd>{pointLabel ?? t("floorplan.pointUnknown")}</dd>
        </div>
        <div>
          <dt>{t("floorplan.detail.model")}</dt>
          <dd>
            {device.model || tl(deviceTypeById[typeKey]?.name_i18n, device.device_type) || "—"}
            {catalogModel?.manual_url ? (
              <>
                {" "}
                <a href={catalogModel.manual_url} className="floorplan-detail-manual-link" target="_blank" rel="noreferrer">
                  {t("floorplan.detail.manual")}
                </a>
              </>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>{t("floorplan.detail.ip")}</dt>
          <dd className="font-mono">{device.ip}</dd>
        </div>
        <div>
          <dt>{t("floorplan.detail.mac")}</dt>
          <dd className="font-mono">{device.mac}</dd>
        </div>
        <div>
          <dt>{t("floorplan.detail.room")}</dt>
          <dd>{room ? tl(room.name_i18n, room.name) : device.installed_location}</dd>
        </div>
        <div>
          <dt>{t("floorplan.detail.connectsVia")}</dt>
          <dd>{device.connects_via}</dd>
        </div>
      </dl>

      {device.notes ? (
        <div className="floorplan-detail-notes">
          <p className="floorplan-detail-notes-label">{t("floorplan.detail.notes")}</p>
          <p>{device.notes}</p>
        </div>
      ) : null}

      {deviceChannels.length > 0 ? (
        <div className="floorplan-detail-channels">
          <p className="floorplan-detail-section-label">{t("floorplan.detail.channels")}</p>
          <ul>
            {deviceChannels.map((channel) => {
              const integration = integrationMap[channel.id] ?? {};
              return (
                <li key={channel.id}>
                  <span>{channel.controls}</span>
                  <span className="floorplan-detail-channel-meta">
                    {[integration.home_assistant && "HA", integration.alexa && "Alexa"]
                      .filter(Boolean)
                      .join(" · ") || channel.type}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {device.images?.length ? (
        <div className="floorplan-detail-photos">
          <p className="floorplan-detail-section-label">{t("floorplan.detail.photos")}</p>
          <div className="photo-gallery photo-gallery-compact">
            {device.images.map((src) => (
              <figure key={src} className="photo-gallery-item">
                <img src={src} alt={device.name} className="photo-gallery-image" />
              </figure>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
