"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/adminClient";
import { prepareImageForUpload } from "@/lib/imageUpload";

export default function PhotoUpload({ entityType, entityId, images, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

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

    try {
      const prepared = await prepareImageForUpload(file);
      const formData = new FormData();
      formData.append("file", prepared, prepared.name || "photo.jpg");
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);

      const result = await adminFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      onChange?.(result.images);
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(url) {
    if (!canUpload) {
      return;
    }

    setError("");

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
          {uploading ? "Uploading…" : "Add photo"}
        </button>
        {!entityId ? <p className="photo-upload-hint">Save the record first to upload photos.</p> : null}
      </div>

      {/* Prefer sr-only over `hidden` — iOS Safari often blocks programmatic clicks on display:none inputs */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/*,.jpg,.jpeg,.png,.webp,.gif"
        className="sr-only"
        onChange={handleUpload}
      />

      {error ? <p className="photo-upload-error">{error}</p> : null}

      {images?.length ? (
        <ul className="photo-upload-grid">
          {images.map((src) => (
            <li key={src} className="photo-upload-item">
              <Image src={src} alt="" width={160} height={120} className="photo-upload-thumb" />
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
