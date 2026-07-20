"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/app/LanguageProvider";

export default function PhotoGallery({
  images,
  altPrefix = "Photo",
  compact = false,
  className = "",
}) {
  const { t } = useI18n();
  const labelId = useId();
  const touchStartX = useRef(null);
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const photos = Array.isArray(images) ? images.filter(Boolean) : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIndex(0);
    setLightboxOpen(false);
  }, [photos.join("|")]);

  useEffect(() => {
    if (!lightboxOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setLightboxOpen(false);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((value) => value - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((value) => value + 1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen]);

  if (!photos.length) {
    return null;
  }

  const current = ((index % photos.length) + photos.length) % photos.length;
  const hasMultiple = photos.length > 1;

  function go(delta) {
    setIndex((value) => value + delta);
  }

  function openLightbox(photoIndex = current) {
    setIndex(photoIndex);
    setLightboxOpen(true);
  }

  function onCarouselKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(current);
      return;
    }
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

  function onTouchStart(event) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event) {
    if (touchStartX.current == null) {
      return;
    }
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) {
      return;
    }
    go(delta < 0 ? 1 : -1);
  }

  const lightbox =
    mounted && lightboxOpen
      ? createPortal(
          <div
            className="photo-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={t("gallery.fullscreen")}
            onClick={() => setLightboxOpen(false)}
          >
            <div className="photo-lightbox-toolbar">
              <p className="photo-lightbox-count" aria-live="polite">
                {t("gallery.counter", { current: current + 1, total: photos.length })}
              </p>
              <button
                type="button"
                className="photo-lightbox-close"
                aria-label={t("gallery.close")}
                onClick={() => setLightboxOpen(false)}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div
              className="photo-lightbox-stage"
              onClick={(event) => event.stopPropagation()}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {hasMultiple ? (
                <button
                  type="button"
                  className="photo-lightbox-nav is-prev"
                  aria-label={t("gallery.prev")}
                  onClick={() => go(-1)}
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>
              ) : null}

              <figure className="photo-lightbox-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={photos[current]}
                  src={photos[current]}
                  alt={`${altPrefix} (${current + 1}/${photos.length})`}
                  className="photo-lightbox-image"
                />
              </figure>

              {hasMultiple ? (
                <button
                  type="button"
                  className="photo-lightbox-nav is-next"
                  aria-label={t("gallery.next")}
                  onClick={() => go(1)}
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {hasMultiple ? (
              <div className="photo-lightbox-thumbs" onClick={(event) => event.stopPropagation()}>
                {photos.map((src, photoIndex) => (
                  <button
                    key={`lightbox-thumb-${src}`}
                    type="button"
                    className={`photo-lightbox-thumb ${photoIndex === current ? "is-active" : ""}`}
                    aria-label={t("gallery.goto", { index: photoIndex + 1 })}
                    onClick={() => setIndex(photoIndex)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="photo-lightbox-thumb-image" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className={`photo-carousel ${compact ? "is-compact" : ""} ${className}`.trim()}
        role="region"
        aria-roledescription="carousel"
        aria-labelledby={labelId}
        tabIndex={0}
        onKeyDown={onCarouselKeyDown}
      >
        <p id={labelId} className="sr-only">
          {altPrefix}
        </p>

        <div className="photo-carousel-stage">
          <button
            type="button"
            className="photo-carousel-open"
            onClick={() => openLightbox(current)}
            aria-label={t("gallery.openFullscreen")}
          >
            <figure className="photo-carousel-frame">
              {/* Native img — more reliable for runtime /uploads than next/image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={photos[current]}
                src={photos[current]}
                alt={`${altPrefix} (${current + 1}/${photos.length})`}
                className="photo-carousel-image"
              />
            </figure>
          </button>

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
          <div className="photo-carousel-thumbs">
            {photos.map((src, photoIndex) => (
              <button
                key={`thumb-${src}`}
                type="button"
                className={`photo-carousel-thumb ${photoIndex === current ? "is-active" : ""}`}
                onClick={() => setIndex(photoIndex)}
                onDoubleClick={() => openLightbox(photoIndex)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="photo-carousel-thumb-image" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {lightbox}
    </>
  );
}
