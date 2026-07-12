"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function PrimaryNav({ className = "" }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className={`primary-nav ${className}`} aria-label="Main">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`primary-nav-link ${active ? "is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
