"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/app/LanguageProvider";
import PhotoUpload from "@/app/admin/components/PhotoUpload";
import { adminFetch } from "@/lib/adminClient";

export default function FloorPlanPointEditor({ point, onSaved, onCancel }) {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!point) {
      setForm(null);
      return;
    }

    const next = {
      id: point.id,
      code: point.code ?? point.svg_marker_id ?? point.id,
      svg_marker_id: point.svg_marker_id,
      room_id: point.room_id,
      notes: point.notes ?? "",
      images: point.images ?? [],
    };

    if (point.kind) {
      next.kind = point.kind;
    }

    setForm(next);
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
        <div aria-hidden="true" />
        <button type="button" className="floorplan-icon-btn" onClick={onCancel} aria-label={t("floorplan.edit.cancel")}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </header>

      <div className="floorplan-editor-form">
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
