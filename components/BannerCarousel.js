"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function BannerCarousel({ images }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (images.length < 2) return;
    // Restarts every time `index` changes — including manual navigation —
    // so clicking an arrow/dot gives the full 5s before it auto-advances
    // again, rather than jumping again almost immediately.
    const t = setTimeout(() => setIndex((i) => (i + 1) % images.length), 5000);
    return () => clearTimeout(t);
  }, [images.length, index]);

  if (!images || images.length === 0) return null;

  function goTo(i) {
    setIndex((i + images.length) % images.length);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) goTo(delta > 0 ? index - 1 : index + 1);
    touchStartX.current = null;
  }

  return (
    <div className="ve-banner" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="ve-banner-slide"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
      {images.length > 1 && (
        <>
          <button className="ve-banner-arrow ve-banner-arrow-prev" onClick={() => goTo(index - 1)} aria-label="Previous slide">
            <ChevronLeft size={20} />
          </button>
          <button className="ve-banner-arrow ve-banner-arrow-next" onClick={() => goTo(index + 1)} aria-label="Next slide">
            <ChevronRight size={20} />
          </button>
          <div className="ve-banner-dots">
            {images.map((src, i) => (
              <button
                key={src}
                className={i === index ? "active" : ""}
                onClick={() => goTo(i)}
                aria-label={`Show slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
