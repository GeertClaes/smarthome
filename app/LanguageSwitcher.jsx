"use client";

import { useI18n } from "./LanguageProvider";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="lang-switcher" aria-label="Language">
      <button
        type="button"
        className={`lang-btn ${language === "en" ? "is-active" : ""}`}
        onClick={() => setLanguage("en")}
      >
        {t("lang.english")}
      </button>
      <button
        type="button"
        className={`lang-btn ${language === "de" ? "is-active" : ""}`}
        onClick={() => setLanguage("de")}
      >
        {t("lang.german")}
      </button>
    </div>
  );
}
