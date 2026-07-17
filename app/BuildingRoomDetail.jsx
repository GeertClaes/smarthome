"use client";

import PhotoGallery from "@/app/components/PhotoGallery";
import { useI18n } from "./LanguageProvider";

export default function BuildingRoomDetail({ room }) {
  const { t, tl } = useI18n();
  const photos = room?.images ?? [];

  if (!room) {
    return (
      <aside className="building-room-detail is-empty" aria-label={t("home.roomPhotos")}>
        <p className="building-room-detail-empty">{t("home.selectRoomHint")}</p>
      </aside>
    );
  }

  return (
    <aside className="building-room-detail" aria-label={t("home.roomPhotos")}>
      <p className="section-kicker">{t("home.roomPhotos")}</p>
      <h2 className="building-room-detail-title">{tl(room.name_i18n, room.name)}</h2>
      {photos.length ? (
        <PhotoGallery images={photos} altPrefix={tl(room.name_i18n, room.name)} compact />
      ) : (
        <p className="building-room-detail-empty">{t("home.noRoomPhotos")}</p>
      )}
    </aside>
  );
}
