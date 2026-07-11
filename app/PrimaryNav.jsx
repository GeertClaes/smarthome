"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./LanguageProvider";

const navItems = [
  { href: "/", labelKey: "nav.building" },
  { href: "/floorplan", labelKey: "nav.floorPlan" },
];

function isActive(pathname, href) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PrimaryNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="nav-strip nav-strip-center">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-pill ${active ? "is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
