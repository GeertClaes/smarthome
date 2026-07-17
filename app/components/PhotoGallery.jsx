"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { useI18n } from "@/app/LanguageProvider";

export default function PhotoGallery({
  images,
  altPrefix = "Photo",
  compact = false,
  className = "",
}) {
  const { t } = useI18n();
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const photos = Array.isArray(images) ? images.filter(Boolean) : [];

  useEffect(() => {
    setIndex(0);
  }, [photos.join("|")]);

  if (!photos.length) {
    return null;
  }

  const current = ((index % photos.length) + photos.length) % photos.length;
  const hasMultiple = photos.length > 1;

  function go(delta) {
    setIndex((value) => value + delta);
  }

  function onKeyDown(event) {
    if (!hasMultiple) {
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
  }

  return (
    <div
      className={`photo-carousel ${compact ? "is-compact" : ""} ${className}`.trim()}
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      tabIndex={hasMultiple ? 0 : undefined}
      onKeyDown={onKeyDown}
    >
      <p id={labelId} className="sr-only">
        {altPrefix}
      </p>

      <div className="photo-carousel-stage">
        <figure className="photo-carousel-frame">
          <Image
            key={photos[current]}
            src={photos[current]}
            alt={`${altPrefix} (${current + 1}/${photos.length})`}
            width={compact ? 640 : 1200}
            height={compact ? 420 : 780}
            className="photo-carousel-image"
            priority={current === 0}
          />
        </figure>

        {hasMultiple ? (
          <>
            <button
              type="button"
              className="photo-carousel-nav is-prev"
              aria-label={t("gallery.prev")}
              onClick={() => go(-1)}
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="photo-carousel-nav is-next"
              aria-label={t("gallery.next")}
              onClick={() => go(1)}
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="photo-carousel-footer">
          <p className="photo-carousel-count" aria-live="polite">
            {t("gallery.counter", { current: current + 1, total: photos.length })}
          </p>
          <div className="photo-carousel-dots" role="tablist" aria-label={t("gallery.dots")}>
            {photos.map((src, photoIndex) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={photoIndex === current}
                aria-label={t("gallery.goto", { index: photoIndex + 1 })}
                className={`photo-carousel-dot ${photoIndex === current ? "is-active" : ""}`}
                onClick={() => setIndex(photoIndex)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {hasMultiple && !compact ? (
        <div className="photo-carousel-thumbs" aria-hidden="true">
          {photos.map((src, photoIndex) => (
            <button
              key={`thumb-${src}`}
              type="button"
              className={`photo-carousel-thumb ${photoIndex === current ? "is-active" : ""}`}
              onClick={() => setIndex(photoIndex)}
            >
              <img src={src} alt="" className="photo-carousel-thumb-image" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
