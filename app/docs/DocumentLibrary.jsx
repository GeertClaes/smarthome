"use client";

import { useSiteContent } from "../SiteContentProvider";
import { useI18n } from "../LanguageProvider";
import SmartHomeGuide from "./SmartHomeGuide";

export default function DocumentLibrary({ documents, guides }) {
  const { t, tl } = useI18n();
  const { ts } = useSiteContent();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">{ts("docs.title")}</h1>
        <p className="mt-2 max-w-3xl text-base-content/70">{ts("docs.subtitle")}</p>
      </header>

      <SmartHomeGuide guides={guides} />

      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-bold">{ts("docs.pdfs.title")}</h2>
          <p className="mt-1 text-sm text-base-content/60">{ts("docs.pdfs.subtitle")}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <article
              key={doc.id}
              className="card border border-primary/10 bg-base-200/60 shadow-none transition-colors hover:border-primary/25"
            >
              <div className="card-body gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <i className={`fa-solid ${doc.icon}`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="card-title text-lg leading-tight">
                      {tl(doc.title_i18n, doc.title)}
                    </h3>
                    <p className="mt-1 text-sm text-base-content/60">
                      {tl(doc.description_i18n, doc.description)}
                    </p>
                  </div>
                </div>

                <div className="card-actions justify-end">
                  <a
                    href={doc.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                    {t("docs.open")}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
