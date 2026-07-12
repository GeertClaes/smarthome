"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LANGUAGE } from "./i18n";
import { useI18n } from "./LanguageProvider";
import { resolveSiteCopy } from "@/lib/siteCopy";

const SiteContentContext = createContext({
  site: null,
  ts: () => "",
});

export function SiteContentProvider({ site, children }) {
  const { language } = useI18n();

  const value = useMemo(() => {
    const ts = (path) => resolveSiteCopy(site, path, language, DEFAULT_LANGUAGE);

    return { site, ts };
  }, [language, site]);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
