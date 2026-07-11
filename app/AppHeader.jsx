"use client";

import LanguageSwitcher from "./LanguageSwitcher";
import PrimaryNav from "./PrimaryNav";
import { useI18n } from "./LanguageProvider";

export default function AppHeader({ roomCount = 0, deviceCount = 0 }) {
  const { t } = useI18n();

  return (
    <header className="app-header">
      <div className="app-header-grid">
        <div className="brand-block">
          <div className="brand-icon" aria-hidden="true">
            ◫
          </div>
          <div>
            <p className="brand-title">{t("header.kicker")}</p>
            <p className="brand-subtitle">{t("header.title")}</p>
          </div>
        </div>

        <PrimaryNav />

        <div className="header-status">
          <div className="header-metric">
            <span className="header-metric-value">{deviceCount}</span>
            <span className="header-metric-label">{t("header.devices")}</span>
          </div>
          <div className="header-metric">
            <span className="header-metric-value">{roomCount}</span>
            <span className="header-metric-label">{t("header.rooms")}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
