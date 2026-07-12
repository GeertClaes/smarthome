"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminClient";
import BilingualField from "./BilingualField";

function updateI18n(form, path, language, value) {
  const next = structuredClone(form);
  let node = next;

  for (let index = 0; index < path.length - 1; index += 1) {
    node = node[path[index]];
  }

  const field = path[path.length - 1];
  node[`${field}_i18n`] = {
    ...node[`${field}_i18n`],
    [language]: value,
  };

  return next;
}

function getI18n(form, path, language) {
  let node = form;

  for (const part of path) {
    node = node?.[part];
  }

  const field = path[path.length - 1];
  return node?.[`${field}_i18n`]?.[language] ?? "";
}

export default function SiteCopyForm({ site }) {
  const router = useRouter();
  const [form, setForm] = useState(site);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setField(path, language, value) {
    setForm((current) => updateI18n(current, path, language, value));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await adminFetch("/api/site", {
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
    <form className="admin-form" onSubmit={handleSubmit}>
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Browser & header</h2>
        <div className="admin-form-grid">
          <BilingualField
            label="Page title (browser tab)"
            en={getI18n(form, ["meta", "title"], "en")}
            de={getI18n(form, ["meta", "title"], "de")}
            onChangeEn={(value) => setField(["meta", "title"], "en", value)}
            onChangeDe={(value) => setField(["meta", "title"], "de", value)}
          />
          <BilingualField
            label="Site description"
            en={getI18n(form, ["meta", "description"], "en")}
            de={getI18n(form, ["meta", "description"], "de")}
            onChangeEn={(value) => setField(["meta", "description"], "en", value)}
            onChangeDe={(value) => setField(["meta", "description"], "de", value)}
            multiline
          />
          <BilingualField
            label="Header title"
            en={getI18n(form, ["header", "title"], "en")}
            de={getI18n(form, ["header", "title"], "de")}
            onChangeEn={(value) => setField(["header", "title"], "en", value)}
            onChangeDe={(value) => setField(["header", "title"], "de", value)}
          />
          <BilingualField
            label="Header subtitle"
            en={getI18n(form, ["header", "subtitle"], "en")}
            de={getI18n(form, ["header", "subtitle"], "de")}
            onChangeEn={(value) => setField(["header", "subtitle"], "en", value)}
            onChangeDe={(value) => setField(["header", "subtitle"], "de", value)}
          />
        </div>
      </section>

      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Home page</h2>
        <div className="admin-form-grid">
          <BilingualField
            label="Overview kicker"
            en={getI18n(form, ["home", "overview_title"], "en")}
            de={getI18n(form, ["home", "overview_title"], "de")}
            onChangeEn={(value) => setField(["home", "overview_title"], "en", value)}
            onChangeDe={(value) => setField(["home", "overview_title"], "de", value)}
          />
          <BilingualField
            label="Default floor hint"
            en={getI18n(form, ["home", "overview_subtitle"], "en")}
            de={getI18n(form, ["home", "overview_subtitle"], "de")}
            onChangeEn={(value) => setField(["home", "overview_subtitle"], "en", value)}
            onChangeDe={(value) => setField(["home", "overview_subtitle"], "de", value)}
            multiline
          />
        </div>
      </section>

      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Documents page</h2>
        <div className="admin-form-grid">
          <BilingualField
            label="Page title"
            en={getI18n(form, ["docs", "title"], "en")}
            de={getI18n(form, ["docs", "title"], "de")}
            onChangeEn={(value) => setField(["docs", "title"], "en", value)}
            onChangeDe={(value) => setField(["docs", "title"], "de", value)}
          />
          <BilingualField
            label="Page intro"
            en={getI18n(form, ["docs", "subtitle"], "en")}
            de={getI18n(form, ["docs", "subtitle"], "de")}
            onChangeEn={(value) => setField(["docs", "subtitle"], "en", value)}
            onChangeDe={(value) => setField(["docs", "subtitle"], "de", value)}
            multiline
          />
          <BilingualField
            label="Smart home guide title"
            en={getI18n(form, ["docs", "guide", "title"], "en")}
            de={getI18n(form, ["docs", "guide", "title"], "de")}
            onChangeEn={(value) => setField(["docs", "guide", "title"], "en", value)}
            onChangeDe={(value) => setField(["docs", "guide", "title"], "de", value)}
          />
          <BilingualField
            label="Smart home guide intro"
            en={getI18n(form, ["docs", "guide", "subtitle"], "en")}
            de={getI18n(form, ["docs", "guide", "subtitle"], "de")}
            onChangeEn={(value) => setField(["docs", "guide", "subtitle"], "en", value)}
            onChangeDe={(value) => setField(["docs", "guide", "subtitle"], "de", value)}
            multiline
          />
          <BilingualField
            label="PDF section title"
            en={getI18n(form, ["docs", "pdfs", "title"], "en")}
            de={getI18n(form, ["docs", "pdfs", "title"], "de")}
            onChangeEn={(value) => setField(["docs", "pdfs", "title"], "en", value)}
            onChangeDe={(value) => setField(["docs", "pdfs", "title"], "de", value)}
          />
          <BilingualField
            label="PDF section intro"
            en={getI18n(form, ["docs", "pdfs", "subtitle"], "en")}
            de={getI18n(form, ["docs", "pdfs", "subtitle"], "de")}
            onChangeEn={(value) => setField(["docs", "pdfs", "subtitle"], "en", value)}
            onChangeDe={(value) => setField(["docs", "pdfs", "subtitle"], "de", value)}
            multiline
          />
        </div>
      </section>

      {error ? <p className="admin-form-error">{error}</p> : null}

      <div className="admin-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save site copy"}
        </button>
      </div>
    </form>
  );
}
