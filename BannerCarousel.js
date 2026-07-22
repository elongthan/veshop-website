"use client";

import { useEffect, useState } from "react";

export default function BannerCarousel({ images }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), 5000);
    return () => clearInterval(t);
  }, [images.length]);

  if (!images || images.length === 0) return null;

  return (
    <div className="ve-banner">
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
        <div className="ve-banner-dots">
          {images.map((src, i) => (
            <button
              key={src}
              className={i === index ? "active" : ""}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
