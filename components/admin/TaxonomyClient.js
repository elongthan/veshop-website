"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Upload, Pencil, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  addBrand, removeBrand, updateBrand,
  addCategory, removeCategory, updateCategory,
  scanOrphanedCategoryNames, mergeCategoryName,
  scanDuplicateCategoryTags, fixDuplicateCategoryTags
} from "@/actions/products";

// Logos are sometimes uploaded straight from a brand's press kit at huge
// dimensions/file sizes. The site only ever displays them small, so shrink
// oversized ones client-side before upload — keeps page load fast and keeps
// the admin preview from looking oddly cropped or zoomed in.
async function resizeImageIfLarge(file, maxDim = 480) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  const bitmap = await createImageBitmap(file);
  if (bitmap.width <= maxDim && bitmap.height <= maxDim) return file;

  const scale = maxDim / Math.max(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".png"), { type: "image/png" });
}

async function uploadToSiteAssets(file, prefix) {
  const supabase = createClient();
  const resized = await resizeImageIfLarge(file);
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}-${resized.name}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, resized, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return data.publicUrl;
}

function IconUploadLabel({ imageUrl, onFile, uploading, title }) {
  return (
    <label className="ve-tax-icon-btn" title={title}>
      {uploading ? (
        <span className="ve-tax-icon-spinner" />
      ) : imageUrl ? (
        <img src={imageUrl} alt="" />
      ) : (
        <Upload size={12} />
      )}
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

export default function TaxonomyClient({ categories, brands }) {
  const [newCat, setNewCat] = useState("");
  const [newCatParent, setNewCatParent] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [renamingCat, setRenamingCat] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingBrand, setRenamingBrand] = useState(null);
  const [brandRenameValue, setBrandRenameValue] = useState("");
  const [uploadingId, setUploadingId] = useState(null); // "cat-<id>" or "brand-<id>"
  const [orphans, setOrphans] = useState(null);
  const [orphanScanning, setOrphanScanning] = useState(false);
  const [mergingName, setMergingName] = useState(null);
  const [mergeTarget, setMergeTarget] = useState({});
  const [dupeTags, setDupeTags] = useState(null);
  const [dupeScanning, setDupeScanning] = useState(false);
  const [dupeFixing, setDupeFixing] = useState(false);
  const router = useRouter();

  const allCategoryNames = categories.map((c) => c.name);

  async function scanOrphans() {
    setOrphanScanning(true);
    const result = await scanOrphanedCategoryNames();
    setOrphans(result);
    setOrphanScanning(false);
  }

  async function handleMerge(oldName) {
    const newName = mergeTarget[oldName];
    if (!newName) return;
    setMergingName(oldName);
    try {
      await mergeCategoryName(oldName, newName);
      setOrphans((os) => os.filter((o) => o.name !== oldName));
      router.refresh();
    } catch (err) {
      alert("Could not merge: " + err.message);
    }
    setMergingName(null);
  }

  async function scanDupes() {
    setDupeScanning(true);
    const result = await scanDuplicateCategoryTags();
    setDupeTags(result);
    setDupeScanning(false);
  }

  async function fixAllDupes() {
    if (!dupeTags?.length) return;
    setDupeFixing(true);
    await fixDuplicateCategoryTags(dupeTags.map((p) => p.id));
    setDupeTags([]);
    setDupeFixing(false);
    router.refresh();
  }

  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenOf = (id) => categories.filter((c) => c.parent_id === id);

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCat.trim()) return;
    await addCategory(newCat.trim(), newCatParent ? Number(newCatParent) : null);
    setNewCat(""); setNewCatParent("");
    router.refresh();
  }
  async function handleRemoveCategory(cat) {
    if (!confirm(`Remove "${cat.name}"? Products keep the label but it drops out of filters.`)) return;
    await removeCategory(cat.id);
    router.refresh();
  }
  async function handleRename(cat) {
    if (!renameValue.trim()) { setRenamingCat(null); return; }
    await updateCategory(cat.id, { name: renameValue.trim() });
    setRenamingCat(null);
    router.refresh();
  }

  async function handleCatIconFile(cat, file) {
    setUploadingId(`cat-${cat.id}`);
    try {
      const url = await uploadToSiteAssets(file, "category-icon");
      await updateCategory(cat.id, { icon_url: url });
      router.refresh();
    } catch (err) {
      alert("Could not upload icon: " + err.message);
    }
    setUploadingId(null);
  }

  async function handleAddBrand(e) {
    e.preventDefault();
    if (!newBrand.trim()) return;
    await addBrand(newBrand.trim());
    setNewBrand("");
    router.refresh();
  }
  async function handleRemoveBrand(name) {
    if (!confirm(`Remove brand "${name}"?`)) return;
    await removeBrand(name);
    router.refresh();
  }
  async function handleBrandLogoFile(brand, file) {
    setUploadingId(`brand-${brand.id}`);
    try {
      const url = await uploadToSiteAssets(file, "brand-logo");
      await updateBrand(brand.id, { logo_url: url });
      router.refresh();
    } catch (err) {
      alert("Could not upload logo: " + err.message);
    }
    setUploadingId(null);
  }

  async function handleRenameBrand(brand) {
    if (!brandRenameValue.trim()) { setRenamingBrand(null); return; }
    await updateBrand(brand.id, { name: brandRenameValue.trim() });
    setRenamingBrand(null);
    router.refresh();
  }

  return (
    <>
    <div className="ve-taxonomy">
      <div className="ve-taxonomy-col">
        <h3>Categories &amp; subcategories</h3>
        <div className="ve-tax-list">
          {topLevel.map((cat) => (
            <div key={cat.id}>
              <div className="ve-tax-item">
                <div className="ve-tax-item-main">
                  <IconUploadLabel
                    imageUrl={cat.icon_url}
                    uploading={uploadingId === `cat-${cat.id}`}
                    title="Change icon"
                    onFile={(file) => handleCatIconFile(cat, file)}
                  />
                  {renamingCat === cat.id ? (
                    <input
                      className="ve-tax-rename-input"
                      value={renameValue}
                      autoFocus
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(cat)}
                      onKeyDown={(e) => e.key === "Enter" && handleRename(cat)}
                    />
                  ) : (
                    <span>{cat.name}</span>
                  )}
                </div>
                <span className="ve-admin-actions">
                  <button type="button" onClick={() => { setRenamingCat(cat.id); setRenameValue(cat.name); }} aria-label="Rename"><Pencil size={13} /></button>
                  <button type="button" onClick={() => handleRemoveCategory(cat)} aria-label="Remove"><X size={14} /></button>
                </span>
              </div>
              {childrenOf(cat.id).map((sub) => (
                <div key={sub.id} className="ve-tax-item ve-tax-item-sub">
                  <div className="ve-tax-item-main">
                    <IconUploadLabel
                      imageUrl={sub.icon_url}
                      uploading={uploadingId === `cat-${sub.id}`}
                      title="Change icon"
                      onFile={(file) => handleCatIconFile(sub, file)}
                    />
                    {renamingCat === sub.id ? (
                      <input
                        className="ve-tax-rename-input"
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRename(sub)}
                        onKeyDown={(e) => e.key === "Enter" && handleRename(sub)}
                      />
                    ) : (
                      <span>↳ {sub.name}</span>
                    )}
                  </div>
                  <span className="ve-admin-actions">
                    <button type="button" onClick={() => { setRenamingCat(sub.id); setRenameValue(sub.name); }} aria-label="Rename"><Pencil size={13} /></button>
                    <button type="button" onClick={() => handleRemoveCategory(sub)} aria-label="Remove"><X size={14} /></button>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <form className="ve-inline-add ve-inline-add-cat" onSubmit={handleAddCategory}>
          <input placeholder="New category or subcategory name" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <select value={newCatParent} onChange={(e) => setNewCatParent(e.target.value)}>
            <option value="">Top-level</option>
            {topLevel.map((c) => <option key={c.id} value={c.id}>Under: {c.name}</option>)}
          </select>
          <button className="ve-btn ve-btn-sm" type="submit"><Plus size={14} /></button>
        </form>
      </div>

      <div className="ve-taxonomy-col">
        <h3>Brands</h3>
        <div className="ve-tax-list">
          {brands.map((b) => (
            <div key={b.id} className="ve-tax-item">
              <div className="ve-tax-item-main">
                <IconUploadLabel
                  imageUrl={b.logo_url}
                  uploading={uploadingId === `brand-${b.id}`}
                  title="Change logo"
                  onFile={(file) => handleBrandLogoFile(b, file)}
                />
                {renamingBrand === b.id ? (
                  <input
                    className="ve-tax-rename-input"
                    value={brandRenameValue}
                    autoFocus
                    onChange={(e) => setBrandRenameValue(e.target.value)}
                    onBlur={() => handleRenameBrand(b)}
                    onKeyDown={(e) => e.key === "Enter" && handleRenameBrand(b)}
                  />
                ) : (
                  <span>{b.name}</span>
                )}
              </div>
              <span className="ve-admin-actions">
                <button type="button" onClick={() => { setRenamingBrand(b.id); setBrandRenameValue(b.name); }} aria-label="Rename"><Pencil size={13} /></button>
                <button type="button" onClick={() => handleRemoveBrand(b.name)} aria-label="Remove"><X size={14} /></button>
              </span>
            </div>
          ))}
        </div>
        <form className="ve-inline-add" onSubmit={handleAddBrand}>
          <input placeholder="New brand name" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} />
          <button className="ve-btn ve-btn-sm" type="submit"><Plus size={14} /></button>
        </form>
      </div>
    </div>

    <div className="ve-admin-head" style={{ marginTop: 34, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
      <h2>Outdated category names on products</h2>
    </div>
    <p className="ve-muted" style={{ marginBottom: 14 }}>
      Renaming a category above only changes the category label — products that were already tagged with
      the old name keep it, since each product stores the category name directly rather than a link to it.
      This finds any such leftover names and lets you merge them into a current category.
    </p>
    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
      <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={scanOrphans} disabled={orphanScanning}>
        <Search size={15} /> {orphanScanning ? "Scanning..." : "Scan products"}
      </button>
    </div>

    {orphans && orphans.length === 0 && (
      <div className="ve-empty" style={{ padding: "30px 0" }}>
        <p>No outdated category names found.</p>
      </div>
    )}

    {orphans?.length > 0 && (
      <div className="ve-dup-group">
        {orphans.map((o) => (
          <div key={o.name} className="ve-admin-row" style={{ gridTemplateColumns: "2fr 1fr 100px" }}>
            <span className="ve-admin-item">
              <span><strong>{o.name}</strong><em>{o.count} product{o.count === 1 ? "" : "s"}</em></span>
            </span>
            <select
              className="ve-select"
              value={mergeTarget[o.name] || ""}
              onChange={(e) => setMergeTarget((m) => ({ ...m, [o.name]: e.target.value }))}
            >
              <option value="">Merge into...</option>
              {allCategoryNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <button
              className="ve-btn ve-btn-sm"
              disabled={!mergeTarget[o.name] || mergingName === o.name}
              onClick={() => handleMerge(o.name)}
            >
              {mergingName === o.name ? "Merging..." : "Merge"}
            </button>
          </div>
        ))}
      </div>
    )}

    <div className="ve-admin-head" style={{ marginTop: 34, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
      <h2>Duplicate category tags on a single product</h2>
    </div>
    <p className="ve-muted" style={{ marginBottom: 14 }}>
      Finds products where the same category is listed more than once on that one product (e.g. "PPE, PPE,
      Safety Shoes") — leftover from the original import. New saves already prevent this; this cleans up
      existing ones.
    </p>
    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
      <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={scanDupes} disabled={dupeScanning}>
        <Search size={15} /> {dupeScanning ? "Scanning..." : "Scan products"}
      </button>
      {dupeTags?.length > 0 && (
        <button className="ve-btn ve-btn-ghost ve-btn-sm" onClick={fixAllDupes} disabled={dupeFixing}>
          {dupeFixing ? "Cleaning..." : `Clean up all ${dupeTags.length}`}
        </button>
      )}
    </div>

    {dupeTags && dupeTags.length === 0 && (
      <div className="ve-empty" style={{ padding: "30px 0" }}>
        <p>No duplicate category tags found.</p>
      </div>
    )}

    {dupeTags?.length > 0 && (
      <div className="ve-dup-group">
        {dupeTags.map((p) => (
          <div key={p.id} className="ve-admin-row" style={{ gridTemplateColumns: "1fr" }}>
            <span className="ve-admin-item">
              <img src={p.image_url || ""} alt="" />
              <span>
                <strong>{p.name}</strong>
                <em>{p.categories.join(", ")}</em>
              </span>
            </span>
          </div>
        ))}
      </div>
    )}
    </>
  );
}
