"use client";

import { useState } from "react";
import FloorCopyForm from "../components/FloorCopyForm";
import SiteCopyForm from "../components/SiteCopyForm";

export default function ContentEditor({ site, floors }) {
  const [tab, setTab] = useState("site");

  return (
    <div className="admin-content-editor">
      <div className="admin-content-tabs" role="tablist" aria-label="Content sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "site"}
          className={`admin-content-tab ${tab === "site" ? "is-active" : ""}`}
          onClick={() => setTab("site")}
        >
          Site copy
        </button>
        {floors.map((floor) => (
          <button
            key={floor.id}
            type="button"
            role="tab"
            aria-selected={tab === floor.id}
            className={`admin-content-tab ${tab === floor.id ? "is-active" : ""}`}
            onClick={() => setTab(floor.id)}
          >
            {floor.name}
          </button>
        ))}
      </div>

      <div className="admin-content-panel">
        {tab === "site" ? (
          <SiteCopyForm site={site} />
        ) : (
          floors
            .filter((floor) => floor.id === tab)
            .map((floor) => <FloorCopyForm key={floor.id} floor={floor} />)
        )}
      </div>
    </div>
  );
}
