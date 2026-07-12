"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminClient";
import { sortDeviceModels } from "@/lib/deviceModels";

const EMPTY_MODEL = {
  id: "",
  name: "",
  manufacturer: "",
  device_type: "",
  manual_url: "",
  notes: "",
  color: "#93c5fd",
  sort_order: 0,
};

function ModelSwatch({ color }) {
  return (
    <span
      className="device-model-swatch"
      style={{ backgroundColor: color || "#64748b" }}
      aria-hidden="true"
    />
  );
}

export default function DeviceModelManager({ initialModels, deviceTypes }) {
  const router = useRouter();
  const [models, setModels] = useState(() => sortDeviceModels(initialModels));
  const [expandedId, setExpandedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const typeNames = useMemo(() => deviceTypes.map((type) => type.name), [deviceTypes]);
  const manufacturers = useMemo(
    () => [...new Set(models.map((entry) => entry.manufacturer).filter(Boolean))].toSorted(),
    [models],
  );

  function openEdit(model) {
    setExpandedId(model.id);
    setDraft({ ...model });
    setCreating(false);
    setError("");
  }

  function openCreate() {
    setExpandedId("__new__");
    setDraft({
      ...EMPTY_MODEL,
      manufacturer: manufacturers[0] ?? "",
      device_type: typeNames[0] ?? "",
    });
    setCreating(true);
    setError("");
  }

  function closeEditor() {
    setExpandedId(null);
    setDraft(null);
    setCreating(false);
    setError("");
  }

  async function persistOrder(nextModels) {
    await adminFetch("/api/device-models", {
      method: "PUT",
      body: JSON.stringify({ order: nextModels.map((entry) => entry.id) }),
    });
    setModels(nextModels);
    router.refresh();
  }

  async function moveModel(id, direction) {
    const index = models.findIndex((entry) => entry.id === id);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= models.length) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const next = [...models];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      await persistOrder(next);
    } catch (moveError) {
      setError(moveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft(event) {
    event.preventDefault();
    if (!draft) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (creating) {
        const created = await adminFetch("/api/device-models", {
          method: "POST",
          body: JSON.stringify(draft),
        });
        setModels((current) => sortDeviceModels([...current, created]));
      } else {
        const updated = await adminFetch(`/api/device-models/${draft.id}`, {
          method: "PUT",
          body: JSON.stringify(draft),
        });
        setModels((current) => sortDeviceModels(current.map((entry) => (entry.id === updated.id ? updated : entry))));
      }

      closeEditor();
      router.refresh();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteModel(id) {
    if (!window.confirm("Delete this model from the catalog? Devices already using the name are not changed.")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await adminFetch(`/api/device-models/${id}`, { method: "DELETE" });
      const next = models.filter((entry) => entry.id !== id);
      setModels(next);
      if (expandedId === id) {
        closeEditor();
      }
      router.refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="device-model-manager">
      <div className="admin-list-toolbar">
        <p className="admin-list-meta">{models.length} models in catalog</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate} disabled={saving}>
          Add model
        </button>
      </div>

      <ul className="device-model-list">
        {models.map((model, index) => {
          const isOpen = expandedId === model.id;
          return (
            <li key={model.id} className={`device-model-item ${isOpen ? "is-open" : ""}`}>
              <div className="device-model-item-head">
                <div className="device-model-item-order">
                  <button
                    type="button"
                    className="device-model-order-btn"
                    disabled={saving || index === 0}
                    onClick={() => moveModel(model.id, -1)}
                    aria-label={`Move ${model.name} up`}
                  >
                    <i className="fa-solid fa-chevron-up" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="device-model-order-btn"
                    disabled={saving || index === models.length - 1}
                    onClick={() => moveModel(model.id, 1)}
                    aria-label={`Move ${model.name} down`}
                  >
                    <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  className="device-model-toggle"
                  aria-expanded={isOpen}
                  onClick={() => (isOpen ? closeEditor() : openEdit(model))}
                >
                  <ModelSwatch color={model.color} />
                  <span className="device-model-item-copy">
                    <span className="device-model-item-name">{model.name}</span>
                    <span className="device-model-item-meta">
                      {[model.manufacturer, model.device_type].filter(Boolean).join(" · ") || "Uncategorized"}
                    </span>
                  </span>
                  <i className={`fa-solid fa-chevron-down device-model-chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true" />
                </button>
              </div>

              {isOpen && draft?.id === model.id ? (
                <form className="device-model-editor" onSubmit={saveDraft}>
                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>Name</span>
                      <input
                        required
                        value={draft.name}
                        onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                      />
                    </label>
                    <label className="admin-field">
                      <span>Manufacturer</span>
                      <input
                        value={draft.manufacturer}
                        onChange={(event) => setDraft((current) => ({ ...current, manufacturer: event.target.value }))}
                        placeholder="e.g. Shelly, AVM, WiZ"
                        list="device-model-manufacturers"
                      />
                    </label>
                    <label className="admin-field">
                      <span>Device category</span>
                      <select
                        value={draft.device_type}
                        onChange={(event) => setDraft((current) => ({ ...current, device_type: event.target.value }))}
                      >
                        <option value="">None</option>
                        {typeNames.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-field">
                      <span>Accent color</span>
                      <input
                        type="color"
                        value={draft.color || "#93c5fd"}
                        onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
                      />
                    </label>
                    <label className="admin-field admin-field-full">
                      <span>Manual / documentation URL</span>
                      <input
                        type="url"
                        value={draft.manual_url}
                        onChange={(event) => setDraft((current) => ({ ...current, manual_url: event.target.value }))}
                        placeholder="https://…"
                      />
                    </label>
                    <label className="admin-field admin-field-full">
                      <span>Notes</span>
                      <textarea
                        rows={3}
                        value={draft.notes}
                        onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                        placeholder="Setup tips, channel layout, firmware notes…"
                      />
                    </label>
                  </div>
                  <div className="device-model-editor-actions">
                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                      {saving ? "Saving…" : "Save model"}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={closeEditor}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-error btn-sm"
                      disabled={saving}
                      onClick={() => deleteModel(model.id)}
                    >
                      Delete
                    </button>
                    {draft.manual_url ? (
                      <a href={draft.manual_url} className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer">
                        Open manual
                      </a>
                    ) : null}
                  </div>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>

      {creating && draft ? (
        <form className="admin-form-panel device-model-create" onSubmit={saveDraft}>
          <header className="admin-form-panel-head">
            <h2 className="admin-form-section-title">New model</h2>
          </header>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Name</span>
              <input
                required
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="admin-field">
              <span>Manufacturer</span>
              <input
                value={draft.manufacturer}
                onChange={(event) => setDraft((current) => ({ ...current, manufacturer: event.target.value }))}
                list="device-model-manufacturers"
              />
            </label>
            <label className="admin-field">
              <span>Device category</span>
              <select
                value={draft.device_type}
                onChange={(event) => setDraft((current) => ({ ...current, device_type: event.target.value }))}
              >
                <option value="">None</option>
                {typeNames.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Accent color</span>
              <input
                type="color"
                value={draft.color || "#93c5fd"}
                onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
              />
            </label>
            <label className="admin-field admin-field-full">
              <span>Manual / documentation URL</span>
              <input
                type="url"
                value={draft.manual_url}
                onChange={(event) => setDraft((current) => ({ ...current, manual_url: event.target.value }))}
              />
            </label>
            <label className="admin-field admin-field-full">
              <span>Notes</span>
              <textarea
                rows={3}
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              />
            </label>
          </div>
          <div className="device-model-editor-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? "Saving…" : "Create model"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={closeEditor}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <datalist id="device-model-manufacturers">
        {manufacturers.map((manufacturer) => (
          <option key={manufacturer} value={manufacturer} />
        ))}
      </datalist>

      {error ? <p className="admin-form-error">{error}</p> : null}
    </div>
  );
}
