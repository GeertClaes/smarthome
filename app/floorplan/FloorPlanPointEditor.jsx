"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/app/LanguageProvider";
import PhotoUpload from "@/app/admin/components/PhotoUpload";
import { adminFetch } from "@/lib/adminClient";
import { getDevicePointLabel } from "@/lib/devicePoints";

export default function FloorPlanPointEditor({ point, onSaved, onCancel }) {
  const { t, tl } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!point) {
      setForm(null);
      return;
    }

    setForm({
      ...point,
      label_i18n: {
        en: point.label_i18n?.en ?? point.label ?? "",
        de: point.label_i18n?.de ?? point.label ?? "",
      },
      images: point.images ?? [],
    });
  }, [point]);

  if (!form) {
    return null;
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const saved = await adminFetch(`/api/device-points/${point.id}`, {
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
        <div>
          <p className="floorplan-inline-editor-kicker">{t("floorplan.inspector.point")}</p>
          <h2 className="floorplan-inline-editor-title">{getDevicePointLabel(point, tl)}</h2>
        </div>
        <button type="button" className="floorplan-icon-btn" onClick={onCancel} aria-label={t("floorplan.edit.cancel")}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </header>

      <div className="floorplan-editor-form">
        <label className="floorplan-editor-field">
          <span>{t("floorplan.points.label")}</span>
          <input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} />
        </label>
        <label className="floorplan-editor-field">
          <span>{t("floorplan.room.nameEn")}</span>
          <input
            value={form.label_i18n.en}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                label_i18n: { ...current.label_i18n, en: event.target.value },
              }))
            }
          />
        </label>
        <label className="floorplan-editor-field">
          <span>{t("floorplan.room.nameDe")}</span>
          <input
            value={form.label_i18n.de}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                label_i18n: { ...current.label_i18n, de: event.target.value },
              }))
            }
          />
        </label>
        <label className="floorplan-editor-field floorplan-editor-field-full">
          <span>{t("floorplan.detail.notes")}</span>
          <textarea
            rows={2}
            value={form.notes ?? ""}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder={t("floorplan.points.notesPlaceholder")}
          />
        </label>
        <div className="floorplan-editor-field floorplan-editor-field-full">
          <span>{t("floorplan.detail.photos")}</span>
          <PhotoUpload
            entityType="device_point"
            entityId={point.id}
            images={form.images}
            onChange={(images) => setForm((current) => ({ ...current, images }))}
          />
        </div>
      </div>

      {error ? <p className="admin-form-error">{error}</p> : null}

      <div className="floorplan-editor-actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? t("floorplan.edit.saving") : t("floorplan.points.savePoint")}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={onCancel}>
          {t("floorplan.edit.cancel")}
        </button>
      </div>
    </form>
  );
}
