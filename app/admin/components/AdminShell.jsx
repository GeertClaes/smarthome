"use client";

import AdminNav from "./AdminNav";
import AdminTokenGate from "./AdminTokenGate";

export default function AdminShell({ children }) {
  return (
    <AdminTokenGate>
      <div className="admin-layout">
        <AdminNav />
        <div className="admin-layout-main">{children}</div>
      </div>
    </AdminTokenGate>
  );
}
