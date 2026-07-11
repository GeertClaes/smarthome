"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LANGUAGE, formatMessage, translations } from "./i18n";

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, values) => formatMessage(key, values),
  tl: (_localizedValue, fallback = "") => fallback,
});

const STORAGE_KEY = "smarthome.language";

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  const updateLanguage = (nextLanguage) => {
    if (!translations[nextLanguage]) {
      return;
    }

    setLanguage(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  const t = (key, values) => {
    const translated =
      translations[language]?.[key] ?? translations[DEFAULT_LANGUAGE]?.[key] ?? key;
    return formatMessage(translated, values);
  };

  const tl = (localizedValue, fallback = "") => {
    if (!localizedValue || typeof localizedValue !== "object") {
      return fallback;
    }

    return localizedValue[language] ?? localizedValue[DEFAULT_LANGUAGE] ?? fallback;
  };

  const value = {
    language,
    setLanguage: updateLanguage,
    t,
    tl,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}
