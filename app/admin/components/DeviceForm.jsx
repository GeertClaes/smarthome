"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DevicePointSelect from "./DevicePointSelect";
import DeviceModelSelect from "./DeviceModelSelect";
import { adminFetch } from "@/lib/adminClient";
import PhotoUpload from "./PhotoUpload";

const emptyDevice = {
  id: "",
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

export default function DeviceForm({ device, rooms, deviceTypes, deviceModels = [], devicePoints = [], mode = "edit" }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...emptyDevice, ...device, images: device?.images ?? [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedPoint = devicePoints.find((point) => point.svg_marker_id === form.floorplan_marker_id);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const { images: _images, ...formFields } = form;
      const payload = {
        ...formFields,
        floorplan_marker_id: form.floorplan_marker_id || undefined,
      };

      if (mode === "create") {
        const created = await adminFetch("/api/devices", {
          method: "POST",
          body: JSON.stringify({ ...payload, images: form.images ?? [] }),
        });
        router.push(`/admin/devices/${created.id}/edit`);
        router.refresh();
        return;
      }

      await adminFetch(`/api/devices/${device.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !device?.id ||
      !window.confirm(
        "Permanently delete this device from the registry? Channels and floor plan links will be removed. This cannot be undone.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await adminFetch(`/api/devices/${device.id}`, { method: "DELETE" });
      router.push("/admin/devices");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError.message);
      setSaving(false);
    }
  }

  return (
    <form className="admin-form admin-form-stacked" onSubmit={handleSubmit}>
      <div className="admin-form-panels">
        <section className="admin-form-panel">
          <header className="admin-form-panel-head">
            <h2 className="admin-form-section-title">Identity</h2>
            <p className="admin-form-panel-lead">Display name and how the device appears in Home Assistant or on the network.</p>
          </header>
          <div className="admin-form-grid">
            {mode === "create" ? (
              <label className="admin-field">
                <span>Id (optional)</span>
                <input
                  value={form.id}
                  onChange={(event) => updateField("id", event.target.value)}
                  placeholder="auto-generated from name"
                />
              </label>
            ) : null}

            <label className="admin-field">
              <span>Name</span>
              <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            </label>

            <label className="admin-field">
              <span>Network / HA name</span>
              <input value={form.current_name} onChange={(event) => updateField("current_name", event.target.value)} />
            </label>

            <label className="admin-field">
              <span>Device type</span>
              <select value={form.device_type} onChange={(event) => updateField("device_type", event.target.value)}>
                {deviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Status</span>
              <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Unknown">Unknown</option>
              </select>
            </label>
          </div>
        </section>

        <section className="admin-form-panel">
          <header className="admin-form-panel-head">
            <h2 className="admin-form-section-title">Placement</h2>
            <p className="admin-form-panel-lead">
              Room and floor plan point. Pick a point to show the device on the interactive map.
            </p>
          </header>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Room</span>
              <select
                required
                value={form.installed_room_id}
                onChange={(event) => updateField("installed_room_id", event.target.value)}
              >
                <option value="">Select room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Floor plan point</span>
              <DevicePointSelect
                value={form.floorplan_marker_id}
                onChange={(svgMarkerId) => {
                  const point = devicePoints.find((entry) => entry.svg_marker_id === svgMarkerId);
                  setForm((current) => ({
                    ...current,
                    floorplan_marker_id: svgMarkerId,
                    ...(point?.room_id ? { installed_room_id: point.room_id } : {}),
                  }));
                }}
                devicePoints={devicePoints}
                rooms={rooms}
                roomId={form.installed_room_id}
              />
            </label>

            {selectedPoint ? (
              <p className="admin-field-hint admin-field-full">
                Map marker: {selectedPoint.svg_marker_id}
                {form.floorplan_marker_id ? (
                  <>
                    {" · "}
                    <Link href="/floorplan" className="admin-inline-link">
                      Open floor plan
                    </Link>
                  </>
                ) : null}
              </p>
            ) : (
              <p className="admin-field-hint admin-field-full">
                No floor plan point selected — assign one here or from the{" "}
                <Link href="/floorplan" className="admin-inline-link">
                  floor plan editor
                </Link>
                .
              </p>
            )}

            <label className="admin-field admin-field-full">
              <span>Location label (optional)</span>
              <input
                value={form.installed_location}
                onChange={(event) => updateField("installed_location", event.target.value)}
                placeholder="Legacy room label, e.g. Living/Dining"
              />
            </label>
          </div>
        </section>

        <section className="admin-form-panel">
          <header className="admin-form-panel-head">
            <h2 className="admin-form-section-title">Network & hardware</h2>
            <p className="admin-form-panel-lead">Technical details for troubleshooting and documentation.</p>
          </header>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Hardware model</span>
              <DeviceModelSelect
                value={form.model}
                onChange={(modelName) => updateField("model", modelName)}
                deviceModels={deviceModels}
                onModelSelected={(model) => {
                  setForm((current) => ({
                    ...current,
                    model: model.name,
                    ...(model.device_type ? { device_type: model.device_type } : {}),
                  }));
                }}
              />
            </label>

            <label className="admin-field">
              <span>Connects via</span>
              <input value={form.connects_via} onChange={(event) => updateField("connects_via", event.target.value)} />
            </label>

            <label className="admin-field">
              <span>IP address</span>
              <input className="font-mono" value={form.ip} onChange={(event) => updateField("ip", event.target.value)} />
            </label>

            <label className="admin-field">
              <span>MAC address</span>
              <input
                className="font-mono"
                value={form.mac}
                onChange={(event) => updateField("mac", event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="admin-form-panel">
          <header className="admin-form-panel-head">
            <h2 className="admin-form-section-title">Notes</h2>
          </header>
          <label className="admin-field admin-field-full">
            <span className="sr-only">Notes</span>
            <textarea rows={4} value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
          </label>
        </section>

        <section className="admin-form-panel">
          <header className="admin-form-panel-head">
            <h2 className="admin-form-section-title">Photos</h2>
            <p className="admin-form-panel-lead">Installation photos shown on the floor plan device detail.</p>
          </header>
          <PhotoUpload
            entityType="device"
            entityId={mode === "create" ? "" : device.id}
            images={form.images}
            onChange={(images) => updateField("images", images)}
          />
        </section>

        {mode === "edit" ? (
          <section className="admin-form-panel admin-form-panel-danger">
            <header className="admin-form-panel-head">
              <h2 className="admin-form-section-title">Delete device</h2>
              <p className="admin-form-panel-lead">
                Permanently removes this device from the registry. To hide it on the map only, clear the floor plan
                point above or use <strong>Remove from point</strong> on the floor plan.
              </p>
            </header>
            <button type="button" className="btn btn-outline btn-error btn-sm" disabled={saving} onClick={handleDelete}>
              Delete device permanently
            </button>
          </section>
        ) : null}
      </div>

      {error ? <p className="admin-form-error">{error}</p> : null}

      <div className="admin-form-actions admin-form-actions-sticky">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create device" : "Save changes"}
        </button>
        <Link href="/admin/devices" className="btn btn-ghost">
          Back to list
        </Link>
      </div>
    </form>
  );
}
