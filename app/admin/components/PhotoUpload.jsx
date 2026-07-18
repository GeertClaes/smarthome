"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/app/LanguageProvider";
import { adminFetch } from "@/lib/adminClient";
import { isHeicLike, prepareImageForUpload } from "@/lib/imageUpload";

export default function PhotoUpload({ entityType, entityId, images, onChange, disabled = false }) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const canUpload = Boolean(entityId) && !disabled;

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    // Clear immediately so the same file can be re-selected on mobile
    event.target.value = "";
    if (!file || !canUpload) {
      return;
    }

    setUploading(true);
    setError("");
    setStatus(isHeicLike(file) ? t("photos.converting") : t("photos.uploading"));

    try {
      const prepared = await prepareImageForUpload(file);
      const formData = new FormData();
      const uploadName =
        prepared.name && String(prepared.name).includes(".")
          ? prepared.name
          : isHeicLike(prepared)
            ? "photo.heic"
            : "photo.jpg";

      formData.append("file", prepared, uploadName);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);

      const result = await adminFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!Array.isArray(result.images)) {
        throw new Error("Upload succeeded but no photo list was returned.");
      }

      onChange?.(result.images);
      setStatus(
        result.converted
          ? t("photos.convertedSaved", { format: String(result.sourceFormat || "HEIC").toUpperCase() })
          : t("photos.saved"),
      );
    } catch (uploadError) {
      console.error("Photo upload failed:", uploadError);
      setError(uploadError.message || "Upload failed.");
      setStatus("");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(url) {
    if (!canUpload) {
      return;
    }

    setError("");
    setStatus("");

    try {
      const params = new URLSearchParams({
        entityType,
        entityId,
        url,
      });
      const result = await adminFetch(`/api/upload?${params.toString()}`, {
        method: "DELETE",
      });
      onChange?.(result.images);
      setStatus(t("photos.removed"));
    } catch (removeError) {
      setError(removeError.message || "Could not remove photo.");
    }
  }

  return (
    <div className="photo-upload">
      <div className="photo-upload-toolbar">
        <button
          type="button"
          className="btn btn-sm btn-outline"
          disabled={!canUpload || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? t("photos.uploading") : "Add photo"}
        </button>
        {!entityId ? <p className="photo-upload-hint">Save the record first to upload photos.</p> : null}
      </div>

      {/*
        Prefer JPEG first so iOS Photos is more likely to hand us a JPEG.
        Still allow HEIC — the server converts those with libheif.
        Prefer sr-only over `hidden` — iOS Safari blocks clicks on display:none inputs.
      */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif,image/*"
        className="sr-only"
        onChange={handleUpload}
      />

      {canUpload ? <p className="photo-upload-hint">{t("photos.savedHint")}</p> : null}
      {error ? <p className="photo-upload-error">{error}</p> : null}
      {status ? <p className="photo-upload-status">{status}</p> : null}

      {images?.length ? (
        <ul className="photo-upload-grid">
          {images.map((src) => (
            <li key={src} className="photo-upload-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="photo-upload-thumb" />
              <button
                type="button"
                className="photo-upload-remove"
                disabled={!canUpload}
                onClick={() => handleRemove(src)}
                aria-label="Remove photo"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="photo-upload-empty">No photos yet.</p>
      )}
    </div>
  );
}
