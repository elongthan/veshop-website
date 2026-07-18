"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Sliders, Package } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import PrintCatalogButton from "@/components/PrintCatalogButton";

function ShopInner({ products, categories, brands, showPrices }) {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [brandFilter, setBrandFilter] = useState([]);
  const [tagFilter, setTagFilter] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("relevance");
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    if (searchParams.get("q")) setQuery(searchParams.get("q"));
    if (searchParams.get("category")) setCategoryFilter(searchParams.get("category"));
  }, [searchParams]);

  const allTags = useMemo(() => {
    const s = new Set();
    products.forEach((p) => (p.tags || []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (categoryFilter && !p.categories?.includes(categoryFilter)) return false;
      if (brandFilter.length && !brandFilter.includes(p.brand)) return false;
      if (tagFilter.length && !tagFilter.every((t) => (p.tags || []).includes(t))) return false;
      if (minPrice !== "" && p.price < Number(minPrice)) return false;
      if (maxPrice !== "" && p.price > Number(maxPrice)) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${p.name} ${p.sku || ""} ${p.brand || ""} ${p.short_description || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name-asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, categoryFilter, brandFilter, tagFilter, minPrice, maxPrice, query, sort]);

  function toggleBrand(b) {
    setBrandFilter((cur) => (cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]));
  }
  function toggleTag(t) {
    setTagFilter((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }
  function clearAll() {
    setCategoryFilter(""); setBrandFilter([]); setTagFilter([]);
    setMinPrice(""); setMaxPrice(""); setQuery("");
  }

  return (
    <main className="ve-shop">
      <div className="ve-shop-toolbar">
        <div>
          <h1>Full catalog</h1>
          <p className="ve-muted">{filtered.length} of {products.length} items</p>
        </div>
        <div className="ve-shop-toolbar-actions">
          <button className="ve-btn ve-btn-ghost ve-btn-sm" onClick={() => setFiltersOpen((v) => !v)}>
            <Sliders size={15} /> Filters
          </button>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="ve-select">
            <option value="relevance">Sort: relevance</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name-asc">Name: A–Z</option>
          </select>
          <PrintCatalogButton />
        </div>
      </div>

      <div className="ve-shop-body">
        {filtersOpen && (
          <aside className="ve-filters">
            <div className="ve-filter-block">
              <label className="ve-filter-label">Search</label>
              <div className="ve-search ve-search-inline">
                <Search size={15} />
                <input placeholder="Name, SKU, keyword..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>

            <div className="ve-filter-block">
              <label className="ve-filter-label">Category</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="ve-select ve-select-block">
                <option value="">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="ve-filter-block">
              <label className="ve-filter-label">Price (SGD)</label>
              <div className="ve-price-range">
                <input type="number" min="0" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <span>–</span>
                <input type="number" min="0" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>

            <div className="ve-filter-block">
              <label className="ve-filter-label">Brand</label>
              <div className="ve-checklist">
                {brands.map((b) => (
                  <label key={b} className="ve-check">
                    <input type="checkbox" checked={brandFilter.includes(b)} onChange={() => toggleBrand(b)} />
                    {b}
                  </label>
                ))}
              </div>
            </div>

            <button className="ve-link" onClick={clearAll}>Clear all filters</button>
          </aside>
        )}

        <div>
          {filtered.length === 0 ? (
            <div className="ve-empty">
              <Package size={32} strokeWidth={1.3} />
              <p>No products match those filters.</p>
              <button className="ve-link" onClick={clearAll}>Clear filters</button>
            </div>
          ) : (
            <div className="ve-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} showPrices={showPrices} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ShopClient(props) {
  return (
    <Suspense fallback={null}>
      <ShopInner {...props} />
    </Suspense>
  );
}
