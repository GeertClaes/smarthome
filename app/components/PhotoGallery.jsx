"use client";

import Image from "next/image";

export default function PhotoGallery({ images, altPrefix = "Photo" }) {
  if (!images?.length) {
    return null;
  }

  return (
    <div className="photo-gallery">
      {images.map((src) => (
        <figure key={src} className="photo-gallery-item">
          <Image src={src} alt={`${altPrefix}`} width={320} height={220} className="photo-gallery-image" />
        </figure>
      ))}
    </div>
  );
}
