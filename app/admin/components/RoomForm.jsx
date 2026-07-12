"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "@/lib/adminClient";
import PhotoUpload from "./PhotoUpload";

const emptyRoom = {
  id: "",
  name: "",
  name_i18n: { en: "", de: "" },
  floor_id: "ground_floor",
  images: [],
};

export default function RoomForm({ room, floors, mode = "edit" }) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...emptyRoom,
    ...room,
    name_i18n: {
      en: room?.name_i18n?.en ?? room?.name ?? "",
      de: room?.name_i18n?.de ?? room?.name ?? "",
    },
    images: room?.images ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (mode === "create") {
        const created = await adminFetch("/api/rooms", {
          method: "POST",
          body: JSON.stringify(form),
        });
        router.push(`/admin/rooms/${created.id}/edit`);
        router.refresh();
        return;
      }

      await adminFetch(`/api/rooms/${room.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!room?.id || !window.confirm("Permanently delete this room? This cannot be undone.")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await adminFetch(`/api/rooms/${room.id}`, { method: "DELETE" });
      router.push("/admin/rooms");
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
            <h2 className="admin-form-section-title">Room details</h2>
            <p className="admin-form-panel-lead">Names shown across the site in English and German.</p>
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
              <span>Default name</span>
              <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            </label>

            <label className="admin-field">
              <span>Name (English)</span>
              <input
                value={form.name_i18n.en}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name_i18n: { ...current.name_i18n, en: event.target.value },
                  }))
                }
              />
            </label>

            <label className="admin-field">
              <span>Name (German)</span>
              <input
                value={form.name_i18n.de}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name_i18n: { ...current.name_i18n, de: event.target.value },
                  }))
                }
              />
            </label>

            <label className="admin-field">
              <span>Floor</span>
              <select value={form.floor_id} onChange={(event) => updateField("floor_id", event.target.value)}>
                {floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="admin-form-panel">
          <header className="admin-form-panel-head">
            <h2 className="admin-form-section-title">Photos</h2>
          </header>
          <PhotoUpload
            entityType="room"
            entityId={mode === "create" ? "" : room.id}
            images={form.images}
            onChange={(images) => updateField("images", images)}
          />
        </section>

        {mode === "edit" ? (
          <section className="admin-form-panel admin-form-panel-danger">
            <header className="admin-form-panel-head">
              <h2 className="admin-form-section-title">Delete room</h2>
              <p className="admin-form-panel-lead">Permanently removes this room from the data files.</p>
            </header>
            <button type="button" className="btn btn-outline btn-error btn-sm" disabled={saving} onClick={handleDelete}>
              Delete room permanently
            </button>
          </section>
        ) : null}
      </div>

      {error ? <p className="admin-form-error">{error}</p> : null}

      <div className="admin-form-actions admin-form-actions-sticky">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create room" : "Save changes"}
        </button>
        <Link href="/admin/rooms" className="btn btn-ghost">
          Back to list
        </Link>
      </div>
    </form>
  );
}
