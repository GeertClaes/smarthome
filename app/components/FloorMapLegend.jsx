"use client";

import { useI18n } from "@/app/LanguageProvider";

export default function FloorMapLegend({ legend }) {
  const { tl } = useI18n();

  if (!legend?.length) {
    return null;
  }

  return (
    <div className="floor-map-legend" aria-label={tl({ en: "Map legend", de: "Kartenlegende" }, "Map legend")}>
      <p className="floor-map-legend-title">
        {tl({ en: "Map legend", de: "Legende" }, "Map legend")}
      </p>
      <ul className="floor-map-legend-list">
        {legend.map((item) => (
          <li key={item.id ?? item.label} className="floor-map-legend-item">
            <span
              className="floor-map-legend-swatch"
              style={{
                backgroundColor: item.color,
                borderColor: item.stroke ?? item.color,
              }}
              aria-hidden="true"
            />
            <span className="floor-map-legend-label">{tl(item.label_i18n, item.label)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
