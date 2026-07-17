"use client";

import { useI18n } from "./LanguageProvider";

const LANGUAGES = [
  { code: "en", labelKey: "lang.english", short: "EN" },
  { code: "de", labelKey: "lang.german", short: "DE" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className="join language-switcher"
      aria-label={t("header.languageLabel")}
    >
      {LANGUAGES.map((entry) => (
        <button
          key={entry.code}
          type="button"
          className={`btn btn-sm join-item ${language === entry.code ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setLanguage(entry.code)}
          aria-pressed={language === entry.code}
          aria-label={t(entry.labelKey)}
          title={t(entry.labelKey)}
        >
          <span className="language-switcher-short">{entry.short}</span>
          <span className="language-switcher-full">{t(entry.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
