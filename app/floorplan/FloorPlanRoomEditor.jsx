"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/app/LanguageProvider";
import PhotoUpload from "@/app/admin/components/PhotoUpload";
import { adminFetch } from "@/lib/adminClient";

export default function FloorPlanRoomEditor({ room, onSaved, onCancel }) {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!room) {
      setForm(null);
      return;
    }

    setForm({
      ...room,
      name_i18n: {
        en: room.name_i18n?.en ?? room.name ?? "",
        de: room.name_i18n?.de ?? room.name ?? "",
      },
      images: room.images ?? [],
    });
  }, [room]);

  if (!form) {
    return null;
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const saved = await adminFetch(`/api/rooms/${room.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      onSaved?.(saved);
      router.refresh();
      onCancel?.();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="floorplan-inline-editor" onSubmit={handleSave}>
      <header className="floorplan-inline-editor-head">
        <h2 className="floorplan-inline-editor-title">{t("floorplan.inspector.editRoomTitle")}</h2>
        <button type="button" className="floorplan-icon-btn" onClick={onCancel} aria-label={t("floorplan.edit.cancel")}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </header>

      <div className="floorplan-editor-form">
        <label className="floorplan-editor-field">
          <span>{t("floorplan.room.name")}</span>
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className="floorplan-editor-field">
          <span>{t("floorplan.room.nameEn")}</span>
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
        <label className="floorplan-editor-field">
          <span>{t("floorplan.room.nameDe")}</span>
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
        <div className="floorplan-editor-field floorplan-editor-field-full">
          <span>{t("floorplan.detail.photos")}</span>
          <PhotoUpload
            entityType="room"
            entityId={room.id}
            images={form.images}
            onChange={(images) => setForm((current) => ({ ...current, images }))}
          />
        </div>
      </div>

      {error ? <p className="admin-form-error">{error}</p> : null}

      <div className="floorplan-editor-actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? t("floorplan.edit.saving") : t("floorplan.room.saveRoom")}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={onCancel}>
          {t("floorplan.edit.cancel")}
        </button>
      </div>
    </form>
  );
}
