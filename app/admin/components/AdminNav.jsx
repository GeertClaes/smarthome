"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", match: "exact" },
  { href: "/admin/devices", label: "Devices" },
  { href: "/admin/models", label: "Models" },
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/content", label: "Site copy" },
];

function isActive(pathname, href, match) {
  if (match === "exact") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      <div className="admin-nav-links">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.match);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <Link href="/floorplan" className="admin-nav-floorplan">
        <i className="fa-solid fa-map" aria-hidden="true" />
        Floor plan
      </Link>
    </nav>
  );
}
