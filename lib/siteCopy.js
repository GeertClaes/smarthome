export function resolveSiteCopy(site, dotPath, language, defaultLanguage = "en") {
  if (!site || !dotPath) {
    return "";
  }

  const parts = dotPath.split(".");
  const field = parts.pop();
  let node = site;

  for (const part of parts) {
    node = node?.[part];
    if (!node) {
      return "";
    }
  }

  const localized = node[`${field}_i18n`];
  if (localized && typeof localized === "object") {
    return localized[language] ?? localized[defaultLanguage] ?? node[field] ?? "";
  }

  return node[field] ?? "";
}

export function normalizeSitePayload(payload) {
  const pickI18n = (value, fallback = "") => ({
    en: value?.en?.trim() || fallback,
    de: value?.de?.trim() || fallback,
  });

  const meta = payload.meta ?? {};
  const header = payload.header ?? {};
  const home = payload.home ?? {};
  const docs = payload.docs ?? {};
  const guide = docs.guide ?? {};
  const pdfs = docs.pdfs ?? {};

  return {
    meta: {
      title_i18n: pickI18n(meta.title_i18n, meta.title ?? ""),
      description_i18n: pickI18n(meta.description_i18n, meta.description ?? ""),
    },
    header: {
      title_i18n: pickI18n(header.title_i18n, header.title ?? "JWS11"),
      subtitle_i18n: pickI18n(header.subtitle_i18n, header.subtitle ?? ""),
    },
    home: {
      overview_title_i18n: pickI18n(home.overview_title_i18n, home.overview_title ?? ""),
      overview_subtitle_i18n: pickI18n(home.overview_subtitle_i18n, home.overview_subtitle ?? ""),
    },
    docs: {
      title_i18n: pickI18n(docs.title_i18n, docs.title ?? ""),
      subtitle_i18n: pickI18n(docs.subtitle_i18n, docs.subtitle ?? ""),
      guide: {
        title_i18n: pickI18n(guide.title_i18n, guide.title ?? ""),
        subtitle_i18n: pickI18n(guide.subtitle_i18n, guide.subtitle ?? ""),
      },
      pdfs: {
        title_i18n: pickI18n(pdfs.title_i18n, pdfs.title ?? ""),
        subtitle_i18n: pickI18n(pdfs.subtitle_i18n, pdfs.subtitle ?? ""),
      },
    },
  };
}
