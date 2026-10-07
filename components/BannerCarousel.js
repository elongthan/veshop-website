"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Banner photos are often uploaded at full camera size (several MB). Serving
// them through Next's image resizer gives phones a right-sized WebP instead.
const WIDTHS = [640, 828, 1200, 1920];

function isOptimisable(src) {
  try { return new URL(src).hostname.endsWith(".supabase.co"); } catch { return false; }
}

function Slide({ src, active, first }) {
  const [raw, setRaw] = useState(!isOptimisable(src));
  const props = raw
    ? { src }
    : {
        src: `/_next/image?url=${encodeURIComponent(src)}&w=1200&q=75`,
        srcSet: WIDTHS.map((w) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75 ${w}w`).join(", "),
        sizes: "100vw"
      };
  return (
    <img
      {...props}
      alt=""
      className="ve-banner-slide"
      style={{ opacity: active ? 1 : 0 }}
      loading={first ? "eager" : "lazy"}
      fetchPriority={first ? "high" : "low"}
      decoding="async"
      // If the resizer ever fails, fall back to the original picture rather than a blank banner.
      onError={() => { if (!raw) setRaw(true); }}
    />
  );
}

export default function BannerCarousel({ images }) {
  const [index, setIndex] = useState(0);
  // Only the first slide loads at first, so it isn't competing with the others.
  const [showRest, setShowRest] = useState(false);
  useEffect(() => {
    const go = () => setShowRest(true);
    if (document.readyState === "complete") { const t = setTimeout(go, 300); return () => clearTimeout(t); }
    window.addEventListener("load", go, { once: true });
    return () => window.removeEventListener("load", go);
  }, []);
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
      {images.map((src, i) =>
        i === 0 || showRest ? <Slide key={src} src={src} active={i === index} first={i === 0} /> : null
      )}
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
