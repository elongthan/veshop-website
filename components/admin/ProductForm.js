"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveProduct } from "@/actions/products";

function loadImage(src, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function resizeImage(file, maxDim = 1000, quality = 0.8, watermarkUrl = null) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = async () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
          else { width = Math.round(width * (maxDim / height)); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        if (watermarkUrl) {
          try {
            const logo = await loadImage(watermarkUrl, "anonymous");
            const wmWidth = width * 0.35;
            const wmHeight = wmWidth * (logo.height / logo.width);
            ctx.globalAlpha = 0.18;
            ctx.drawImage(logo, (width - wmWidth) / 2, (height - wmHeight) / 2, wmWidth, wmHeight);
            ctx.globalAlpha = 1;
          } catch (e) {
            // Watermark couldn't load (e.g. CORS) — continue without it
            // rather than block the whole upload.
          }
        }

        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProductForm({ product, categories, brands, watermarkLogo, onDone, onCancel }) {
  const [form, setForm] = useState(() => product ? {
    id: product.id,
    sku: product.sku || "",
    name: product.name || "",
    brand: product.brand || brands[0] || "",
    categories: product.categories?.length ? product.categories : (categories[0] ? [categories[0]] : []),
    price: product.price ?? "",
    salePrice: product.sale_price ?? "",
    shortDescription: product.short_description || "",
    newArrival: !!product.new_arrival,
    active: product.active !== false,
    images: product.images?.length ? product.images : []
  } : {
    id: "", sku: "", name: "", brand: brands[0] || "",
    categories: categories[0] ? [categories[0]] : [],
    price: "", salePrice: "", shortDescription: "", newArrival: false, active: true, images: []
  });
  const [tagInput, setTagInput] = useState((product?.tags || []).join(", "));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const supabase = createClient();
      for (const file of files) {
        const blob = await resizeImage(file, 1000, 0.8, watermarkLogo);
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error } = await supabase.storage.from("product-images").upload(path, blob, {
          contentType: "image/jpeg",
          upsert: false
        });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        setForm((f) => ({ ...f, images: [...f.images, data.publicUrl] }));
      }
    } catch (err) {
      alert("Could not upload that image: " + err.message);
    }
    setUploading(false);
    e.target.value = "";
  }

  function removeImage(url) {
    setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));
  }

  function setAsCover(url) {
    setForm((f) => ({ ...f, images: [url, ...f.images.filter((u) => u !== url)] }));
  }

  function toggleCategory(cat) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter((c) => c !== cat) : [...f.categories, cat]
    }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return alert("Item name is required.");
    if (form.price === "" || isNaN(Number(form.price))) return alert("Enter a valid price.");
    if (form.images.length === 0) return alert("Upload at least one product image.");
    if (form.categories.length === 0) return alert("Select at least one category.");
    setSaving(true);
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      await saveProduct({ ...form, tags });
      onDone();
    } catch (err) {
      alert("Could not save: " + err.message);
      setSaving(false);
    }
  }

  return (
    <form className="ve-product-form" onSubmit={submit}>
      <div className="ve-form-grid">
        <div className="ve-form-imgcol">
          <label className="ve-filter-label">Photos * (at least one — click a photo to make it the cover)</label>
          <div className="ve-multi-images">
            {form.images.map((url, i) => (
              <div key={url} className={`ve-multi-image-item ${i === 0 ? "is-cover" : ""}`} onClick={() => setAsCover(url)}>
                {i === 0 && <span className="ve-cover-badge">Cover</span>}
                <img src={url} alt="" />
                <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(url); }}><X size={12} /></button>
              </div>
            ))}
            <button type="button" className="ve-multi-image-add" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload size={16} />
              <span>{uploading ? "Uploading..." : "Add photo"}</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} hidden />
          <label className="ve-check" style={{ marginTop: 12 }}>
            <input
              type="checkbox" checked={form.newArrival}
              onChange={(e) => setForm((f) => ({ ...f, newArrival: e.target.checked }))}
            />
            Mark as new arrival
          </label>
          <label className="ve-check" style={{ marginTop: 6 }}>
            <input
              type="checkbox" checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active (visible on website)
          </label>
        </div>

        <div className="ve-form-fields">
          <label className="ve-filter-label">Item name *</label>
          <input
            value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Rhino UN101SP Ultranite Safety Shoes" required
          />

          <div className="ve-form-row">
            <div>
              <label className="ve-filter-label">SKU</label>
              <input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="e.g. UN101SP0BLK" />
            </div>
            <div>
              <label className="ve-filter-label">Price, GST included (SGD) *</label>
              <input
                type="number" step="0.01" min="0" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00" required
              />
            </div>
          </div>

          <div className="ve-form-row">
            <div>
              <label className="ve-filter-label">Sale price (optional — leave blank if not on sale)</label>
              <input
                type="number" step="0.01" min="0" value={form.salePrice}
                onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                placeholder="e.g. 32.00"
              />
            </div>
          </div>

          <label className="ve-filter-label">Brand</label>
          <select value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>

          <label className="ve-filter-label">Categories * (select all that apply)</label>
          <div className="ve-checklist ve-checklist-cats">
            {categories.map((c) => (
              <label key={c} className="ve-check">
                <input type="checkbox" checked={form.categories.includes(c)} onChange={() => toggleCategory(c)} />
                {c}
              </label>
            ))}
          </div>

          <label className="ve-filter-label">Short description</label>
          <textarea
            rows={3} value={form.shortDescription}
            onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
            placeholder="One or two sentences customers will see on the product card"
          />

          <label className="ve-filter-label">Tag words (comma separated)</label>
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="e.g. safety shoes, steel toe, waterproof" />
        </div>
      </div>

      <div className="ve-form-actions">
        <button type="button" className="ve-btn ve-btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="ve-btn ve-btn-primary" disabled={saving || uploading}>
          {saving ? "Saving..." : product ? "Save changes" : "Add item"}
        </button>
      </div>
    </form>
  );
}
