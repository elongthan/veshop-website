"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveProduct } from "@/actions/products";

function resizeImage(file, maxDim = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
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
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProductForm({ product, categories, brands, onDone, onCancel }) {
  const [form, setForm] = useState(() => product ? {
    id: product.id,
    sku: product.sku || "",
    name: product.name || "",
    brand: product.brand || brands[0] || "",
    category: product.category || categories[0] || "",
    price: product.price ?? "",
    shortDescription: product.short_description || "",
    newArrival: !!product.new_arrival,
    imageUrl: product.image_url || ""
  } : {
    id: "", sku: "", name: "", brand: brands[0] || "", category: categories[0] || "",
    price: "", shortDescription: "", newArrival: false, imageUrl: ""
  });
  const [tagInput, setTagInput] = useState((product?.tags || []).join(", "));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await resizeImage(file);
      const supabase = createClient();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error } = await supabase.storage.from("product-images").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: false
      });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, imageUrl: data.publicUrl }));
    } catch (err) {
      alert("Could not upload that image: " + err.message);
    }
    setUploading(false);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return alert("Item name is required.");
    if (form.price === "" || isNaN(Number(form.price))) return alert("Enter a valid price.");
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
          <label className="ve-filter-label">Photo</label>
          <div className="ve-upload-box" onClick={() => fileRef.current?.click()}>
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="" />
            ) : (
              <div className="ve-upload-empty">
                <Upload size={20} />
                <span>{uploading ? "Uploading..." : "Click to upload image"}</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} hidden />
          <label className="ve-check" style={{ marginTop: 10 }}>
            <input
              type="checkbox" checked={form.newArrival}
              onChange={(e) => setForm((f) => ({ ...f, newArrival: e.target.checked }))}
            />
            Mark as new arrival
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
              <label className="ve-filter-label">Brand</label>
              <select value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="ve-filter-label">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
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
