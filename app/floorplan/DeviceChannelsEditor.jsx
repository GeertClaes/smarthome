"use client";

import { useI18n } from "@/app/LanguageProvider";

const CHANNEL_TYPES = ["switch", "cover", "light"];

function emptyChannel(index, roomId) {
  return {
    channel_index: index,
    controls: "",
    type: "switch",
    room_id: roomId,
  };
}

export default function DeviceChannelsEditor({ channels, roomId, onChange }) {
  const { t } = useI18n();

  function updateChannel(index, field, value) {
    onChange(
      channels.map((channel, channelIndex) =>
        channelIndex === index ? { ...channel, [field]: value } : channel,
      ),
    );
  }

  function addChannel() {
    onChange([...channels, emptyChannel(channels.length, roomId)]);
  }

  function removeChannel(index) {
    onChange(
      channels
        .filter((_, channelIndex) => channelIndex !== index)
        .map((channel, channelIndex) => ({ ...channel, channel_index: channelIndex })),
    );
  }

  return (
    <section className="floorplan-channels-editor">
      <div className="floorplan-channels-editor-head">
        <p className="floorplan-detail-section-label">{t("floorplan.detail.channels")}</p>
        <button type="button" className="btn btn-ghost btn-xs" onClick={addChannel}>
          <i className="fa-solid fa-plus" aria-hidden="true" />
          {t("floorplan.channels.add")}
        </button>
      </div>

      {channels.length === 0 ? (
        <p className="floorplan-channels-empty">{t("floorplan.channels.empty")}</p>
      ) : (
        <ul className="floorplan-channels-list">
          {channels.map((channel, index) => (
            <li key={channel.id ?? `new-${index}`} className="floorplan-channel-row">
              <label className="floorplan-editor-field">
                <span>{t("floorplan.channels.controls")}</span>
                <input
                  required
                  value={channel.controls}
                  onChange={(event) => updateChannel(index, "controls", event.target.value)}
                  placeholder={t("floorplan.channels.controlsPlaceholder")}
                />
              </label>
              <label className="floorplan-editor-field">
                <span>{t("floorplan.channels.type")}</span>
                <select value={channel.type} onChange={(event) => updateChannel(index, "type", event.target.value)}>
                  {CHANNEL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`floorplan.channels.type.${type}`)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="floorplan-icon-btn floorplan-channel-remove"
                onClick={() => removeChannel(index)}
                aria-label={t("floorplan.channels.remove")}
              >
                <i className="fa-solid fa-trash" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
