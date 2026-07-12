"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminClient";
import BilingualField from "./BilingualField";

function cloneFloor(floor) {
  return {
    ...floor,
    name_i18n: {
      en: floor.name_i18n?.en ?? floor.name ?? "",
      de: floor.name_i18n?.de ?? floor.name ?? "",
    },
    summary_i18n: {
      en: floor.summary_i18n?.en ?? floor.summary ?? "",
      de: floor.summary_i18n?.de ?? floor.summary ?? "",
    },
    overview_hint_i18n: {
      en: floor.overview_hint_i18n?.en ?? floor.overview_hint ?? "",
      de: floor.overview_hint_i18n?.de ?? floor.overview_hint ?? "",
    },
    map_legend: (floor.map_legend ?? []).map((item) => ({
      ...item,
      label_i18n: {
        en: item.label_i18n?.en ?? item.label ?? "",
        de: item.label_i18n?.de ?? item.label ?? "",
      },
    })),
  };
}

export default function FloorCopyForm({ floor }) {
  const router = useRouter();
  const [form, setForm] = useState(() => cloneFloor(floor));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateLegendLabel(index, language, value) {
    setForm((current) => ({
      ...current,
      map_legend: current.map_legend.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              label_i18n: { ...item.label_i18n, [language]: value },
            }
          : item,
      ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await adminFetch(`/api/floors/${floor.id}`, {
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

  return (
    <form className="admin-form admin-floor-copy-form" onSubmit={handleSubmit}>
      <header className="admin-floor-copy-head">
        <h2 className="admin-form-section-title">{form.name_i18n.en || floor.name}</h2>
        <p className="admin-page-lead">Floor-specific text shown on the home page when this level is selected.</p>
      </header>

      <div className="admin-form-grid">
        <BilingualField
          label="Floor name"
          en={form.name_i18n.en}
          de={form.name_i18n.de}
          onChangeEn={(value) =>
            setForm((current) => ({
              ...current,
              name: value || current.name,
              name_i18n: { ...current.name_i18n, en: value },
            }))
          }
          onChangeDe={(value) =>
            setForm((current) => ({
              ...current,
              name_i18n: { ...current.name_i18n, de: value },
            }))
          }
        />
        <BilingualField
          label="Summary (under floor title)"
          en={form.summary_i18n.en}
          de={form.summary_i18n.de}
          onChangeEn={(value) =>
            setForm((current) => ({
              ...current,
              summary: value || current.summary,
              summary_i18n: { ...current.summary_i18n, en: value },
            }))
          }
          onChangeDe={(value) =>
            setForm((current) => ({
              ...current,
              summary_i18n: { ...current.summary_i18n, de: value },
            }))
          }
          multiline
        />
        <BilingualField
          label="Hint (map legend guidance)"
          en={form.overview_hint_i18n.en}
          de={form.overview_hint_i18n.de}
          onChangeEn={(value) =>
            setForm((current) => ({
              ...current,
              overview_hint_i18n: { ...current.overview_hint_i18n, en: value },
            }))
          }
          onChangeDe={(value) =>
            setForm((current) => ({
              ...current,
              overview_hint_i18n: { ...current.overview_hint_i18n, de: value },
            }))
          }
          multiline
        />
      </div>

      {form.map_legend?.length ? (
        <section className="admin-form-section">
          <h3 className="admin-form-section-title">Map legend labels</h3>
          <div className="admin-form-grid">
            {form.map_legend.map((item, index) => (
              <div key={item.id} className="admin-legend-editor">
                <p className="admin-legend-editor-id">
                  <span
                    className="admin-legend-swatch"
                    style={{ background: item.color, boxShadow: `inset 0 0 0 2px ${item.stroke}` }}
                    aria-hidden="true"
                  />
                  {item.id}
                </p>
                <BilingualField
                  label="Legend label"
                  en={item.label_i18n.en}
                  de={item.label_i18n.de}
                  onChangeEn={(value) => updateLegendLabel(index, "en", value)}
                  onChangeDe={(value) => updateLegendLabel(index, "de", value)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {error ? <p className="admin-form-error">{error}</p> : null}

      <div className="admin-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : `Save ${floor.name}`}
        </button>
      </div>
    </form>
  );
}
