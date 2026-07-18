"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

export default function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="ve-product-img">
        <div className="ve-img-fallback"><ImageOff size={40} strokeWidth={1.2} /></div>
      </div>
    );
  }

  return (
    <div>
      <div className="ve-product-img">
        <img src={images[active]} alt={name} />
      </div>
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
    </div>
  );
}
