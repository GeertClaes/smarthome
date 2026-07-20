"use client";

import PhotoGallery from "@/app/components/PhotoGallery";
import PhotoUpload from "@/app/admin/components/PhotoUpload";
import { useI18n } from "./LanguageProvider";

export default function BuildingRoomDetail({ room, onImagesChange }) {
  const { t, tl } = useI18n();
  const photos = room?.images ?? [];

  if (!room) {
    return (
      <section className="building-room-detail is-empty" aria-label={t("home.roomPhotos")}>
        <p className="building-room-detail-empty">{t("home.selectRoomHint")}</p>
      </section>
    );
  }

  return (
    <section className="building-room-detail" aria-label={t("home.roomPhotos")}>
      <div className="building-room-detail-head">
        <p className="section-kicker">{t("home.roomPhotos")}</p>
        <h2 className="building-room-detail-title">{tl(room.name_i18n, room.name)}</h2>
      </div>
      {photos.length ? (
        <PhotoGallery images={photos} altPrefix={tl(room.name_i18n, room.name)} />
      ) : (
        <p className="building-room-detail-empty">{t("home.noRoomPhotos")}</p>
      )}
      <div className="building-room-detail-manage">
        <p className="building-room-detail-manage-label">{t("home.manageRoomPhotos")}</p>
        <PhotoUpload
          entityType="room"
          entityId={room.id}
          images={photos}
          onChange={(images) => onImagesChange?.(room.id, images)}
        />
      </div>
    </section>
  );
}
