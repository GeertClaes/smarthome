"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DeviceModelSelect from "@/app/admin/components/DeviceModelSelect";
import { useI18n } from "@/app/LanguageProvider";
import PhotoUpload from "@/app/admin/components/PhotoUpload";
import { adminFetch } from "@/lib/adminClient";
import {
  buildPointLookup,
  formatDeviceOptionLabel,
  sortDevicesForPicker,
} from "@/lib/deviceAssignment";
import { getDevicePointLabel } from "@/lib/devicePoints";
import DeviceChannelsEditor from "./DeviceChannelsEditor";

const CREATE_NEW = "__new__";

const emptyDevice = {
  name: "",
  current_name: "",
  mac: "",
  ip: "",
  model: "",
  device_type: "Wall Switch",
  connects_via: "",
  status: "Online",
  installed_location: "",
  installed_room_id: "",
  notes: "",
  floorplan_marker_id: "",
  images: [],
};

export default function FloorPlanMarkerEditor({
  markerId,
  point,
  device,
  devicesAtMarker,
  room,
  rooms = [],
  deviceModels = [],
  devicePoints = [],
  registryDevices = [],
  channels = [],
  onSaved,
  onRemovedFromPoint,
  onChannelsSaved,
  onSelectDevice,
  onCancel,
}) {
  const { t, tl } = useI18n();
  const router = useRouter();
  const isCreate = !device;
  const [assignDeviceId, setAssignDeviceId] = useState(CREATE_NEW);
  const [form, setForm] = useState(emptyDevice);
  const [channelForm, setChannelForm] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pointByMarker = useMemo(() => buildPointLookup(devicePoints), [devicePoints]);
  const roomById = useMemo(() => Object.fromEntries(rooms.map((entry) => [entry.id, entry])), [rooms]);
  const pickerDevices = useMemo(() => sortDevicesForPicker(registryDevices), [registryDevices]);

  useEffect(() => {
    if (device) {
      setForm({
        ...emptyDevice,
        ...device,
        images: device.images ?? [],
      });
      setChannelForm(channels.filter((channel) => channel.device_id === device.id));
      return;
    }

    setAssignDeviceId(CREATE_NEW);
    setForm({
      ...emptyDevice,
      installed_room_id: room?.id ?? "",
      installed_location: room ? tl(room.name_i18n, room.name) : "",
      floorplan_marker_id: markerId ?? "",
    });
    setChannelForm([]);
  }, [device, markerId, room, tl, channels]);

  useEffect(() => {
    if (!isCreate || assignDeviceId === CREATE_NEW || !assignDeviceId) {
      if (isCreate && assignDeviceId === CREATE_NEW) {
        setForm({
          ...emptyDevice,
          installed_room_id: room?.id ?? "",
          installed_location: room ? tl(room.name_i18n, room.name) : "",
          floorplan_marker_id: markerId ?? "",
        });
        setChannelForm([]);
      }
      return;
    }

    const selected = registryDevices.find((entry) => entry.id === assignDeviceId);
    if (!selected) {
      return;
    }

    setForm({
      ...emptyDevice,
      ...selected,
      installed_room_id: room?.id ?? selected.installed_room_id,
      installed_location: room ? tl(room.name_i18n, room.name) : selected.installed_location,
      floorplan_marker_id: markerId ?? selected.floorplan_marker_id ?? "",
      images: selected.images ?? [],
    });
    setChannelForm(channels.filter((channel) => channel.device_id === selected.id));
  }, [assignDeviceId, channels, isCreate, markerId, registryDevices, room, tl]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleModelChange(modelName, model) {
    setForm((current) => ({
      ...current,
      model: modelName,
      ...(model?.device_type ? { device_type: model.device_type } : {}),
    }));
  }

  async function saveChannelsForDevice(deviceId) {
    if (!channelForm.length) {
      await adminFetch(`/api/devices/${deviceId}/channels`, {
        method: "PUT",
        body: JSON.stringify({ channels: [] }),
      });
      onChannelsSaved?.(deviceId, []);
      return;
    }

    const saved = await adminFetch(`/api/devices/${deviceId}/channels`, {
      method: "PUT",
      body: JSON.stringify({ channels: channelForm }),
    });
    onChannelsSaved?.(deviceId, saved);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        floorplan_marker_id: form.floorplan_marker_id || markerId || undefined,
      };

      if (isCreate && assignDeviceId !== CREATE_NEW && assignDeviceId) {
        const updated = await adminFetch(`/api/devices/${assignDeviceId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        await saveChannelsForDevice(assignDeviceId);
        onSaved?.(updated);
        router.refresh();
        return;
      }

      if (isCreate) {
        const created = await adminFetch("/api/devices", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await saveChannelsForDevice(created.id);
        onSaved?.(created);
        router.refresh();
        return;
      }

      const updated = await adminFetch(`/api/devices/${device.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      await saveChannelsForDevice(device.id);
      onSaved?.(updated);
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveFromPoint() {
    if (!device?.id || !form.floorplan_marker_id) {
      return;
    }

    if (!window.confirm(t("floorplan.edit.confirmRemoveFromPoint"))) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await adminFetch(`/api/devices/${device.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          floorplan_marker_id: undefined,
        }),
      });
      onRemovedFromPoint?.(updated);
      router.refresh();
    } catch (removeError) {
      setError(removeError.message);
      setSaving(false);
    }
  }

  if (!markerId) {
    return (
      <div className="floorplan-device-detail is-empty">
        <p>{t("floorplan.edit.selectMarker")}</p>
      </div>
    );
  }

  const pointLabel = point ? getDevicePointLabel(point, tl) : null;
  const assigningExisting = isCreate && assignDeviceId !== CREATE_NEW && Boolean(assignDeviceId);

  return (
    <form className="floorplan-inline-editor floorplan-device-editor" onSubmit={handleSubmit}>
      <header className="floorplan-inline-editor-head">
        <div>
          <p className="floorplan-inline-editor-kicker">
            {isCreate ? t("floorplan.edit.addDeviceAt") : t("floorplan.edit.editDeviceAt")}
          </p>
          <h2 className="floorplan-inline-editor-title">{pointLabel ?? tl(room?.name_i18n, room?.name)}</h2>
        </div>
        <button type="button" className="floorplan-icon-btn" onClick={onCancel} aria-label={t("floorplan.edit.cancel")}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </header>

      {isCreate ? (
        <div className="floorplan-editor-device-picker">
          <label htmlFor="floorplan-assign-device">{t("floorplan.edit.chooseDevice")}</label>
          <select
            id="floorplan-assign-device"
            value={assignDeviceId}
            onChange={(event) => setAssignDeviceId(event.target.value)}
          >
            <option value={CREATE_NEW}>{t("floorplan.edit.createNewDevice")}</option>
            {pickerDevices.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {formatDeviceOptionLabel(entry, { roomById, pointByMarker, tl })}
              </option>
            ))}
          </select>
          <p className="floorplan-editor-help">
            {t("floorplan.edit.assignHelp")}{" "}
            <Link href="/admin/devices/new" className="floorplan-editor-link">
              {t("floorplan.edit.openAdminDevices")}
            </Link>
          </p>
        </div>
      ) : null}

      {devicesAtMarker.length > 1 && !isCreate ? (
        <div className="floorplan-editor-device-picker">
          <label htmlFor="floorplan-device-picker">{t("floorplan.edit.switchDevice")}</label>
          <select
            id="floorplan-device-picker"
            value={device?.id ?? ""}
            onChange={(event) => onSelectDevice?.(event.target.value)}
          >
            {devicesAtMarker.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="floorplan-editor-form">
        <fieldset className="floorplan-editor-group">
          <legend>{t("floorplan.edit.groupBasics")}</legend>
          <div className="floorplan-editor-form-grid">
            <label className="floorplan-editor-field">
              <span>{t("floorplan.edit.name")}</span>
              <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            </label>
            <label className="floorplan-editor-field floorplan-editor-field-full">
              <span>{t("floorplan.edit.type")}</span>
              <DeviceModelSelect
                value={form.model}
                onChange={(modelName) => updateField("model", modelName)}
                deviceModels={deviceModels}
                onModelSelected={(model) => handleModelChange(model.name, model)}
              />
              <p className="floorplan-editor-help">
                {t("floorplan.edit.modelHelp")}{" "}
                <Link href="/admin/models" className="floorplan-editor-link">
                  {t("floorplan.edit.openAdminModels")}
                </Link>
              </p>
            </label>
          </div>
        </fieldset>

        <details className="floorplan-editor-details" open={assigningExisting}>
          <summary>{t("floorplan.edit.networkDetails")}</summary>
          <div className="floorplan-editor-form-grid">
            <label className="floorplan-editor-field">
              <span>{t("floorplan.edit.currentName")}</span>
              <input value={form.current_name} onChange={(event) => updateField("current_name", event.target.value)} />
            </label>
            <label className="floorplan-editor-field">
              <span>{t("floorplan.detail.ip")}</span>
              <input value={form.ip} onChange={(event) => updateField("ip", event.target.value)} />
            </label>
            <label className="floorplan-editor-field">
              <span>{t("floorplan.detail.mac")}</span>
              <input value={form.mac} onChange={(event) => updateField("mac", event.target.value)} />
            </label>
            <label className="floorplan-editor-field floorplan-editor-field-full">
              <span>{t("floorplan.detail.connectsVia")}</span>
              <input value={form.connects_via} onChange={(event) => updateField("connects_via", event.target.value)} />
            </label>
          </div>
        </details>

        {!isCreate || assigningExisting ? (
          <DeviceChannelsEditor
            channels={channelForm}
            roomId={form.installed_room_id || room?.id}
            onChange={setChannelForm}
          />
        ) : null}

        <label className="floorplan-editor-field floorplan-editor-field-full">
          <span>{t("floorplan.detail.notes")}</span>
          <textarea rows={3} value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
        </label>

        {!isCreate ? (
          <section className="floorplan-editor-photos">
            <p className="floorplan-detail-section-label">{t("floorplan.detail.photos")}</p>
            <PhotoUpload
              entityType="device"
              entityId={device.id}
              images={form.images}
              onChange={(images) => updateField("images", images)}
            />
          </section>
        ) : null}
      </div>

      {error ? <p className="admin-form-error">{error}</p> : null}

      <div className="floorplan-editor-actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving
            ? t("floorplan.edit.saving")
            : isCreate
              ? assigningExisting
                ? t("floorplan.edit.assignDevice")
                : t("floorplan.edit.create")
              : t("floorplan.edit.save")}
        </button>
        {!isCreate && form.floorplan_marker_id ? (
          <div className="floorplan-editor-unassign">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={saving}
              onClick={handleRemoveFromPoint}
            >
              {t("floorplan.edit.removeFromPoint")}
            </button>
            <p className="floorplan-editor-help">{t("floorplan.edit.removeFromPointHelp")}</p>
          </div>
        ) : null}
        {onCancel ? (
          <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={onCancel}>
            {t("floorplan.edit.cancel")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
