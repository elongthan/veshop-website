"use client";

import { useState, useEffect } from "react";
import { ImageOff, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export default function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    if (!zoomOpen) return;
    function handleKey(e) {
      if (e.key === "Escape") setZoomOpen(false);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % images.length);
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [zoomOpen, images?.length]);

  if (!images || images.length === 0) {
    return (
      <div className="ve-product-img">
        <div className="ve-img-fallback"><ImageOff size={40} strokeWidth={1.2} /></div>
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="ve-product-img ve-product-img-zoomable" onClick={() => setZoomOpen(true)} aria-label="Click to enlarge image">
        <img src={images[active]} alt={name} />
        <span className="ve-zoom-hint"><ZoomIn size={14} /> Click to enlarge</span>
      </button>
      {images.length > 1 && (
        <div className="ve-gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              className={i === active ? "active" : ""}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}

      {zoomOpen && (
        <div className="ve-lightbox" onClick={() => setZoomOpen(false)}>
          <button className="ve-lightbox-close" onClick={() => setZoomOpen(false)} aria-label="Close">
            <X size={22} />
          </button>
          {images.length > 1 && (
            <button
              className="ve-lightbox-arrow ve-lightbox-arrow-prev"
              onClick={(e) => { e.stopPropagation(); setActive((i) => (i - 1 + images.length) % images.length); }}
              aria-label="Previous image"
            >
              <ChevronLeft size={26} />
            </button>
          )}
          <img
            src={images[active]}
            alt={name}
            className="ve-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <button
              className="ve-lightbox-arrow ve-lightbox-arrow-next"
              onClick={(e) => { e.stopPropagation(); setActive((i) => (i + 1) % images.length); }}
              aria-label="Next image"
            >
              <ChevronRight size={26} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
