"use client";

import AdminNav from "./AdminNav";

export default function AdminShell({ children }) {
  return (
    <div className="admin-layout">
      <AdminNav />
      <div className="admin-layout-main">{children}</div>
    </div>
  );
}
