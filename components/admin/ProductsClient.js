"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { deleteProduct } from "@/actions/products";
import { fmtPrice } from "@/lib/slug";
import ProductForm from "./ProductForm";

export default function ProductsClient({ products, categories, brands }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const list = products.filter((p) =>
    `${p.name} ${p.sku || ""} ${p.brand || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  function startAdd() { setEditing(null); setShowForm(true); }
  function startEdit(p) { setEditing(p); setShowForm(true); }

  function handleDone() {
    setShowForm(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(p) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await deleteProduct(p.id);
    router.refresh();
  }

  if (showForm) {
    return (
      <>
        <div className="ve-admin-head"><h2>{editing ? "Edit item" : "Add item"}</h2></div>
        <ProductForm
          product={editing}
          categories={categories}
          brands={brands}
          onDone={handleDone}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </>
    );
  }

  return (
    <>
      <div className="ve-admin-head">
        <h2>Products <span className="ve-muted">({products.length})</span></h2>
        <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={startAdd}><Plus size={15} /> Add item</button>
      </div>
      <div className="ve-search ve-search-inline" style={{ marginBottom: 14 }}>
        <Search size={15} />
        <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="ve-admin-table">
        <div className="ve-admin-row ve-admin-row-head">
          <span>Item</span><span>Brand</span><span>Category</span><span>Price</span><span></span>
        </div>
        {list.map((p) => (
          <div className="ve-admin-row" key={p.id}>
            <span className="ve-admin-item">
              <img src={p.image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23EDEEE9'/%3E%3C/svg%3E"} alt="" />
              <span>
                <strong>{p.name}</strong>
                <em>{p.sku || "no SKU"}</em>
              </span>
            </span>
            <span>{p.brand || "—"}</span>
            <span>{p.category || "—"}</span>
            <span>{fmtPrice(p.price)}</span>
            <span className="ve-admin-actions">
              <button onClick={() => startEdit(p)} aria-label="Edit"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(p)} aria-label="Delete"><Trash2 size={15} /></button>
            </span>
          </div>
        ))}
        {list.length === 0 && <div className="ve-empty" style={{ padding: "32px 0" }}>No products found.</div>}
      </div>
    </>
  );
}
