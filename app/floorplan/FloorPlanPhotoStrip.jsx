"use client";

import PhotoGallery from "@/app/components/PhotoGallery";
import { useI18n } from "@/app/LanguageProvider";

export default function FloorPlanPhotoStrip({ device, point, room }) {
  const { t, tl } = useI18n();

  const sections = [];

  if (device?.images?.length) {
    sections.push({
      key: `device-${device.id}`,
      label: t("floorplan.detail.photos"),
      images: device.images,
      altPrefix: device.name,
    });
  }

  if (point?.images?.length) {
    sections.push({
      key: `point-${point.id}`,
      label: t("floorplan.detail.pointPhotos"),
      images: point.images,
      altPrefix: point.code || point.id || "Point",
    });
  }

  if (room?.images?.length) {
    sections.push({
      key: `room-${room.id}`,
      label: t("floorplan.detail.roomPhotos"),
      images: room.images,
      altPrefix: tl(room.name_i18n, room.name),
    });
  }

  if (!sections.length) {
    return null;
  }

  return (
    <section className="floorplan-photo-strip" aria-label={t("home.roomPhotos")}>
      {sections.map((section) => (
        <div key={section.key} className="floorplan-photo-strip-section">
          <p className="floorplan-detail-section-label">{section.label}</p>
          <PhotoGallery images={section.images} altPrefix={section.altPrefix} />
        </div>
      ))}
    </section>
  );
}
