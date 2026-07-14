"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";
import { addBrand, addCategory, removeBrand, removeCategory } from "@/actions/products";

export default function TaxonomyClient({ categories, brands }) {
  const [newCat, setNewCat] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const router = useRouter();

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCat.trim()) return;
    await addCategory(newCat.trim());
    setNewCat("");
    router.refresh();
  }
  async function handleRemoveCategory(name) {
    if (!confirm(`Remove category "${name}"? Existing products keep the label but it drops out of filters.`)) return;
    await removeCategory(name);
    router.refresh();
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

  return (
    <div className="ve-taxonomy">
      <div className="ve-taxonomy-col">
        <h3>Categories</h3>
        <div className="ve-tax-list">
          {categories.map((c) => (
            <div key={c} className="ve-tax-item">
              <span>{c}</span>
              <button onClick={() => handleRemoveCategory(c)} aria-label="Remove"><X size={14} /></button>
            </div>
          ))}
        </div>
        <form className="ve-inline-add" onSubmit={handleAddCategory}>
          <input placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <button className="ve-btn ve-btn-sm" type="submit"><Plus size={14} /></button>
        </form>
      </div>
      <div className="ve-taxonomy-col">
        <h3>Brands</h3>
        <div className="ve-tax-list">
          {brands.map((b) => (
            <div key={b} className="ve-tax-item">
              <span>{b}</span>
              <button onClick={() => handleRemoveBrand(b)} aria-label="Remove"><X size={14} /></button>
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
