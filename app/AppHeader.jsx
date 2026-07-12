"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import PrimaryNav from "./PrimaryNav";
import { useSiteContent } from "./SiteContentProvider";
import { useI18n } from "./LanguageProvider";

const navItems = [
  { href: "/", labelKey: "nav.building", icon: "fa-building" },
  { href: "/floorplan", labelKey: "nav.floorPlan", icon: "fa-map" },
  { href: "/docs", labelKey: "nav.docs", icon: "fa-folder-open" },
];

function isActive(pathname, href) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppHeader() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { ts } = useSiteContent();

  return (
    <header className="site-navbar">
      <div className="content-pane site-navbar-inner">
        <div className="navbar-start gap-2">
          <div className="dropdown lg:hidden">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-square btn-sm"
              aria-label={t("header.menuLabel")}
            >
              <i className="fa-solid fa-bars text-base" aria-hidden="true" />
            </button>
            <ul
              tabIndex={0}
              className="menu dropdown-content menu-sm z-[60] mt-3 w-52 rounded-box border border-white/10 bg-base-200 p-2 shadow-lg"
            >
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={`gap-2 ${active ? "active font-semibold" : ""}`}>
                      <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                      {t(item.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold leading-tight tracking-tight text-base-content">
              {ts("header.title")}
            </p>
            <p className="truncate text-xs text-base-content/50">{ts("header.subtitle")}</p>
          </div>
        </div>

        <div className="navbar-center hidden lg:flex">
          <PrimaryNav />
        </div>

        <div className="navbar-end header-toolbar">
          <LanguageSwitcher />
          <Link
            href="/admin"
            className={`btn btn-sm btn-square btn-ghost header-settings-btn ${pathname.startsWith("/admin") ? "is-active" : ""}`}
            aria-label={t("header.settingsLabel")}
          >
            <i className="fa-solid fa-gear" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
