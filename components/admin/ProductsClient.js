"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, AlertTriangle, Star, GripVertical, Eye, EyeOff, ArrowRightLeft, PackageX } from "lucide-react";
import { deleteProduct, deleteAllProducts, updateProductOrder, toggleProductActive, toggleProductStock, bulkMoveCategory } from "@/actions/products";
import { fmtPrice } from "@/lib/slug";
import ProductForm from "./ProductForm";

export default function ProductsClient({ products, categories, brands, watermarkLogo }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [deletingAll, setDeletingAll] = useState(false);
  const [dragOrder, setDragOrder] = useState(null); // array of ids, local drag state
  const [savingOrder, setSavingOrder] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [moveTarget, setMoveTarget] = useState("");
  const [moving, setMoving] = useState(false);
  const dragIndexRef = useRef(null);
  const router = useRouter();

  async function handleToggleActive(p) {
    setTogglingId(p.id);
    try {
      await toggleProductActive(p.id, p.active === false);
      router.refresh();
    } catch (err) {
      alert("Could not update status: " + err.message);
    }
    setTogglingId(null);
  }

  async function handleToggleStock(p) {
    setTogglingId(`stock-${p.id}`);
    try {
      await toggleProductStock(p.id, !p.out_of_stock);
      router.refresh();
    } catch (err) {
      alert("Could not update stock status: " + err.message);
    }
    setTogglingId(null);
  }

  useEffect(() => {
    setDragOrder(null);
    setSelectedIds(new Set());
  }, [search, categoryFilter, statusFilter, brandFilter, sortBy]);

  function toggleSelect(id) {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(ids) {
    setSelectedIds((s) => s.size === ids.length ? new Set() : new Set(ids));
  }

  async function handleBulkMove() {
    if (!moveTarget || selectedIds.size === 0) return;
    setMoving(true);
    try {
      await bulkMoveCategory(Array.from(selectedIds), categoryFilter, moveTarget);
      setSelectedIds(new Set());
      setMoveTarget("");
      router.refresh();
    } catch (err) {
      alert("Could not move products: " + err.message);
    }
    setMoving(false);
  }

  const filtered = products.filter((p) => {
    const matchesSearch = `${p.name} ${p.sku || ""} ${p.brand || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || (p.categories || []).includes(categoryFilter);
    const matchesStatus = !statusFilter
      || (statusFilter === "active" ? p.active !== false
        : statusFilter === "inactive" ? p.active === false
        : statusFilter === "out_of_stock" ? !!p.out_of_stock
        : !!p.new_arrival);
    const matchesBrand = !brandFilter || (brandFilter === "__none__" ? !p.brand : p.brand === brandFilter);
    return matchesSearch && matchesCategory && matchesStatus && matchesBrand;
  });

  const sorted = sortBy === "custom" ? filtered : [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "name_asc": return a.name.localeCompare(b.name);
      case "name_desc": return b.name.localeCompare(a.name);
      case "price_asc": return (a.price || 0) - (b.price || 0);
      case "price_desc": return (b.price || 0) - (a.price || 0);
      case "oldest": return new Date(a.created_at) - new Date(b.created_at);
      case "newest":
      default: return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // In custom-order mode, apply any in-progress local drag reorder on top of
  // the server order (products are already fetched ordered by sort_order).
  const list = sortBy === "custom" && dragOrder
    ? dragOrder.map((id) => sorted.find((p) => p.id === id)).filter(Boolean)
    : sorted;

  const canDrag = sortBy === "custom";

  function handleDragStart(index) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(index) {
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === index) return;
    const currentIds = list.map((p) => p.id);
    const moved = currentIds.splice(fromIndex, 1)[0];
    currentIds.splice(index, 0, moved);
    setDragOrder(currentIds);
    dragIndexRef.current = null;
    persistOrder(currentIds);
  }

  async function persistOrder(orderedIds) {
    setSavingOrder(true);
    try {
      await updateProductOrder(orderedIds);
      router.refresh();
    } catch (err) {
      alert("Could not save order: " + err.message);
    }
    setSavingOrder(false);
  }

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

  async function handleDeleteAll() {
    const typed = prompt(
      `This permanently deletes all ${products.length} products. Type DELETE to confirm.`
    );
    if (typed !== "DELETE") return;
    setDeletingAll(true);
    try {
      await deleteAllProducts();
      router.refresh();
    } catch (err) {
      alert("Could not delete: " + err.message);
    }
    setDeletingAll(false);
  }

  if (showForm) {
    return (
      <>
        <div className="ve-admin-head"><h2>{editing ? "Edit item" : "Add item"}</h2></div>
        <ProductForm
          product={editing}
          categories={categories}
          brands={brands}
          watermarkLogo={watermarkLogo}
          onDone={handleDone}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </>
    );
  }

  return (
    <>
      <div className="ve-admin-head">
        <h2>Products <span className="ve-muted">({list.length}{list.length !== products.length ? ` of ${products.length}` : ""})</span></h2>
        <div style={{ display: "flex", gap: 8 }}>
          {products.length > 0 && (
            <button className="ve-btn ve-btn-ghost ve-btn-sm ve-btn-danger" onClick={handleDeleteAll} disabled={deletingAll}>
              <AlertTriangle size={14} /> {deletingAll ? "Deleting..." : "Delete all products"}
            </button>
          )}
          <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={startAdd}><Plus size={15} /> Add item</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <div className="ve-search ve-search-inline" style={{ flex: "1 1 200px", marginBottom: 0 }}>
          <Search size={15} />
          <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="ve-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ minWidth: 150 }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="ve-select" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} style={{ minWidth: 150 }}>
          <option value="">All brands</option>
          <option value="__none__">No brand</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="ve-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ minWidth: 130 }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="new_arrival">New arrival</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
        <select className="ve-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ minWidth: 150 }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="price_asc">Price low–high</option>
          <option value="price_desc">Price high–low</option>
          <option value="custom">Custom order (drag to reorder)</option>
        </select>
      </div>
      {canDrag && (
        <p className="ve-muted" style={{ fontSize: 13, marginTop: -8, marginBottom: 12 }}>
          Drag rows by the <GripVertical size={12} style={{ verticalAlign: "-2px" }} /> handle to set the order
          they appear on the website within whatever's currently filtered here.
          {savingOrder && " Saving..."}
        </p>
      )}
      {selectedIds.size > 0 && (
        categoryFilter ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: "var(--paper)", borderRadius: 8, flexWrap: "wrap" }}>
            <ArrowRightLeft size={15} className="ve-muted" />
            <strong style={{ fontSize: 13.5 }}>{selectedIds.size} selected</strong>
            <span className="ve-muted" style={{ fontSize: 13 }}>— move out of "{categoryFilter}" into:</span>
            <select className="ve-select" value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)} style={{ minWidth: 160 }}>
              <option value="">Choose category...</option>
              {categories.filter((c) => c !== categoryFilter).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={handleBulkMove} disabled={!moveTarget || moving}>
              {moving ? "Moving..." : "Move"}
            </button>
            <button className="ve-btn ve-btn-ghost ve-btn-sm" onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        ) : (
          <p className="ve-muted" style={{ fontSize: 13, marginBottom: 12 }}>
            {selectedIds.size} selected — filter by a specific category above first, so I know which
            category to move these out of.
          </p>
        )
      )}
      <div className="ve-admin-table">
        <div className="ve-admin-row ve-admin-row-head">
          <span>
            <input
              type="checkbox"
              checked={list.length > 0 && selectedIds.size === list.length}
              onChange={() => toggleSelectAll(list.map((p) => p.id))}
              aria-label="Select all"
            />
          </span>
          <span>Item</span><span>Brand</span><span>Categories</span><span>Price</span><span>Sale price</span><span>Status</span><span>Date added</span><span></span>
        </div>
        {list.map((p, index) => (
          <div
            className="ve-admin-row"
            key={p.id}
            draggable={canDrag}
            onDragStart={() => canDrag && handleDragStart(index)}
            onDragOver={canDrag ? handleDragOver : undefined}
            onDrop={() => canDrag && handleDrop(index)}
            style={canDrag ? { cursor: "grab" } : undefined}
          >
            <span>
              <input
                type="checkbox"
                checked={selectedIds.has(p.id)}
                onChange={() => toggleSelect(p.id)}
                aria-label={`Select ${p.name}`}
              />
            </span>
            <span className="ve-admin-item">
              {canDrag && <GripVertical size={15} className="ve-muted" style={{ flexShrink: 0 }} />}
              <img src={p.image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23EDEEE9'/%3E%3C/svg%3E"} alt="" />
              <span>
                <strong>{p.name}</strong>
                <em>{p.sku || "no SKU"}</em>
              </span>
            </span>
            <span>{p.brand || "—"}</span>
            <span>{p.categories?.join(", ") || "—"}</span>
            <span>{fmtPrice(p.price)}</span>
            <span>
              {p.sale_price != null && Number(p.sale_price) < Number(p.price)
                ? <span className="ve-price-now" style={{ fontSize: 13.5 }}>{fmtPrice(p.sale_price)}</span>
                : <span className="ve-muted">—</span>}
            </span>
            <span>
              <button
                type="button"
                onClick={() => handleToggleActive(p)}
                disabled={togglingId === p.id}
                className={`ve-badge ve-badge-toggle ${p.active !== false ? "ve-badge-success" : "ve-badge-warning"}`}
                title={p.active !== false ? "Click to mark inactive (hides from website)" : "Click to mark active"}
              >
                {p.active !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                {togglingId === p.id ? "..." : (p.active !== false ? "Active" : "Inactive")}
              </button>
              {p.new_arrival && (
                <span className="ve-badge" style={{ marginLeft: 4, background: "#FFF3C4", color: "#7A5A00" }}>
                  <Star size={11} fill="currentColor" /> New arrival
                </span>
              )}
              <button
                type="button"
                onClick={() => handleToggleStock(p)}
                disabled={togglingId === `stock-${p.id}`}
                className="ve-badge ve-badge-toggle"
                style={{ marginLeft: 4, background: p.out_of_stock ? "#FDE2E1" : "var(--paper)", color: p.out_of_stock ? "#A3231E" : "var(--muted)" }}
                title={p.out_of_stock ? "Click to mark back in stock" : "Click to mark out of stock"}
              >
                <PackageX size={11} />
                {togglingId === `stock-${p.id}` ? "..." : (p.out_of_stock ? "Out of stock" : "Mark out of stock")}
              </button>
            </span>
            <span className="ve-muted" style={{ fontSize: 12.5 }}>
              {p.created_at ? new Date(p.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </span>
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
