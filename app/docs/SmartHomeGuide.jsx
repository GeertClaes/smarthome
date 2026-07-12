"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSiteContent } from "../SiteContentProvider";
import { useI18n } from "../LanguageProvider";

export default function SmartHomeGuide({ guides }) {
  const { language } = useI18n();
  const { ts } = useSiteContent();
  const content = guides[language] ?? guides.en;

  return (
    <section className="docs-guide-section">
      <header className="docs-guide-head">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <i className="fa-solid fa-house-signal" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{ts("docs.guide.title")}</h2>
          <p className="mt-1 text-sm text-base-content/60">{ts("docs.guide.subtitle")}</p>
        </div>
      </header>

      <article className="docs-prose card border border-primary/10 bg-base-200/40 shadow-none">
        <div className="card-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </article>
    </section>
  );
}
