"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Upload, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  addBrand, removeBrand, updateBrand,
  addCategory, removeCategory, updateCategory
} from "@/actions/products";

async function uploadToSiteAssets(file, prefix) {
  const supabase = createClient();
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return data.publicUrl;
}

export default function TaxonomyClient({ categories, brands }) {
  const [newCat, setNewCat] = useState("");
  const [newCatParent, setNewCatParent] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [renamingCat, setRenamingCat] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [catIconTarget, setCatIconTarget] = useState(null);
  const [brandLogoTarget, setBrandLogoTarget] = useState(null);
  const router = useRouter();
  const catIconInputRef = useRef(null);
  const brandLogoInputRef = useRef(null);

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

  function startCatIconUpload(cat) {
    setCatIconTarget(cat);
    // Wait a tick so the target is set before the (now-empty) input opens
    setTimeout(() => catIconInputRef.current?.click(), 0);
  }
  async function handleCatIconChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !catIconTarget) return;
    try {
      const url = await uploadToSiteAssets(file, "category-icon");
      await updateCategory(catIconTarget.id, { icon_url: url });
      router.refresh();
    } catch (err) {
      alert("Could not upload icon: " + err.message);
    }
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

  function startBrandLogoUpload(brand) {
    setBrandLogoTarget(brand);
    setTimeout(() => brandLogoInputRef.current?.click(), 0);
  }
  async function handleBrandLogoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !brandLogoTarget) return;
    try {
      const url = await uploadToSiteAssets(file, "brand-logo");
      await updateBrand(brandLogoTarget.id, { logo_url: url });
      router.refresh();
    } catch (err) {
      alert("Could not upload logo: " + err.message);
    }
  }

  return (
    <div className="ve-taxonomy">
      <input ref={catIconInputRef} type="file" accept="image/*" hidden onChange={handleCatIconChange} />
      <input ref={brandLogoInputRef} type="file" accept="image/*" hidden onChange={handleBrandLogoChange} />

      <div className="ve-taxonomy-col">
        <h3>Categories &amp; subcategories</h3>
        <div className="ve-tax-list">
          {topLevel.map((cat) => (
            <div key={cat.id}>
              <div className="ve-tax-item">
                <div className="ve-tax-item-main">
                  <button type="button" className="ve-tax-icon-btn" onClick={() => startCatIconUpload(cat)} title="Change icon">
                    {cat.icon_url ? <img src={cat.icon_url} alt="" /> : <Upload size={12} />}
                  </button>
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
                    <button type="button" className="ve-tax-icon-btn" onClick={() => startCatIconUpload(sub)} title="Change icon">
                      {sub.icon_url ? <img src={sub.icon_url} alt="" /> : <Upload size={12} />}
                    </button>
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
                <button type="button" className="ve-tax-icon-btn" onClick={() => startBrandLogoUpload(b)} title="Change logo">
                  {b.logo_url ? <img src={b.logo_url} alt="" /> : <Upload size={12} />}
                </button>
                <span>{b.name}</span>
              </div>
              <button type="button" onClick={() => handleRemoveBrand(b.name)} aria-label="Remove"><X size={14} /></button>
            </div>
          ))}
        </div>
        <form className="ve-inline-add" onSubmit={handleAddBrand}>
          <input placeholder="New brand name" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} />
          <button className="ve-btn ve-btn-sm" type="submit"><Plus size={14} /></button>
        </form>
      </div>
    </div>
  );
}
