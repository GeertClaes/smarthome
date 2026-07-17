"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./LanguageProvider";

export default function AppFooter() {
  const pathname = usePathname();
  const { t } = useI18n();
  const adminActive = pathname.startsWith("/admin");

  return (
    <footer className="site-footer">
      <div className="content-pane site-footer-inner">
        <p className="site-footer-copy">{t("footer.copy")}</p>
        <Link
          href="/admin"
          className={`site-footer-admin ${adminActive ? "is-active" : ""}`}
        >
          <i className="fa-solid fa-gear" aria-hidden="true" />
          <span>{t("header.settingsLabel")}</span>
        </Link>
      </div>
    </footer>
  );
}
