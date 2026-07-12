"use client";

import { useEffect, useState } from "react";

export default function AdminTokenGate({ children }) {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(window.sessionStorage.getItem("adminToken") ?? "");
    setReady(true);
  }, []);

  function saveToken(event) {
    event.preventDefault();
    window.sessionStorage.setItem("adminToken", token.trim());
    setReady(true);
  }

  if (!ready) {
    return null;
  }

  const storedToken = typeof window !== "undefined" ? window.sessionStorage.getItem("adminToken") : "";

  return (
    <div className="admin-shell">
      <section className="admin-token-panel">
        <p className="admin-token-copy">
          Optional admin token. Leave empty when <code>ADMIN_TOKEN</code> is not set on the server.
        </p>
        <form className="admin-token-form" onSubmit={saveToken}>
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Admin token"
            aria-label="Admin token"
          />
          <button type="submit" className="btn btn-sm btn-outline">
            {storedToken ? "Update token" : "Set token"}
          </button>
        </form>
      </section>
      {children}
    </div>
  );
}
