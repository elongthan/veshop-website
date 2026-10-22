"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, Menu } from "lucide-react";
import SideNav from "./SideNav";
import EnquiryListLink from "./EnquiryListLink";
import { fmtPrice } from "@/lib/slug";

export default function Header({ settings }) {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef(null);

  function goToResults(q) {
    const value = q.trim();
    if (!value) return;
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(value)}`);
  }

  function onSearch(e) {
    e.preventDefault();
    if (active >= 0 && results[active]) {
      setOpen(false);
      router.push(`/product/${results[active].id}`);
      return;
    }
    goToResults(term);
  }

  // Look up matches shortly after typing stops (no need to press Enter).
  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) { setResults([]); setSearching(false); setActive(-1); return; }
    setSearching(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = await res.json();
        setResults(data.results || []);
        setActive(-1);
        setOpen(true);
      } catch {
        // aborted or offline — keep whatever is showing
      }
      setSearching(false);
    }, 250);
    return () => { clearTimeout(t); controller.abort(); };
  }, [term]);

  // Close the list when clicking elsewhere.
  useEffect(() => {
    function onDown(e) { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function onKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i <= 0 ? results.length - 1 : i - 1)); }
    else if (e.key === "Escape") { setOpen(false); setActive(-1); }
  }

  const siteName = settings?.site_name || "VESHOP";

  return (
    <header className="ve-header">
      <div className="ve-hazard-bar" />
      <div className="ve-header-row">
        <button className="ve-menu-btn" onClick={() => setNavOpen(true)} aria-label="Open category menu">
          <Menu size={20} />
        </button>
        <Link href="/" className="ve-logo">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={siteName} className="ve-logo-img" />
          ) : (
            <span className="ve-logo-mark">{siteName.slice(0, 2).toUpperCase()}</span>
          )}
          <span className="ve-logo-text">
            <strong>{siteName}</strong>
          </span>
        </Link>
        <nav className="ve-nav">
          <Link href="/">Home</Link>
          <Link href="/about">About Us</Link>
          <Link href="/contact">Contact Us</Link>
          <Link href="/testimonials">Reviews</Link>
          <EnquiryListLink />
        </nav>
        <form className="ve-search" onSubmit={onSearch} ref={boxRef} role="search">
          <Search size={16} />
          <input
            name="q"
            value={term}
            placeholder="Search products, brands, SKU..."
            autoComplete="off"
            role="combobox"
            aria-expanded={open && term.trim().length >= 2}
            aria-controls="ve-search-results"
            aria-autocomplete="list"
            onChange={(e) => { setTerm(e.target.value); if (e.target.value.trim().length >= 2) setOpen(true); }}
            onFocus={() => { if (results.length) setOpen(true); }}
            onKeyDown={onKeyDown}
          />
          {open && term.trim().length >= 2 && (
            <div className="ve-search-results" id="ve-search-results" role="listbox">
              {results.map((r, i) => (
                <Link
                  key={r.id}
                  href={`/product/${r.id}`}
                  role="option"
                  aria-selected={i === active}
                  className={`ve-search-result${i === active ? " active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {r.image ? <img src={r.image} alt="" width="36" height="36" loading="lazy" /> : <span className="ve-search-noimg" />}
                  <span className="ve-search-result-text">
                    <strong>{r.name}</strong>
                    <em>{[r.brand, r.sku].filter(Boolean).join(" · ")}</em>
                  </span>
                  {r.price != null && <span className="ve-search-result-price">{fmtPrice(r.price)}</span>}
                </Link>
              ))}
              {results.length === 0 && !searching && <div className="ve-search-empty">No products found for "{term.trim()}"</div>}
              {results.length === 0 && searching && <div className="ve-search-empty">Searching...</div>}
              <button type="button" className="ve-search-all" onClick={() => goToResults(term)}>
                See all results for "{term.trim()}"
              </button>
            </div>
          )}
        </form>
      </div>
      <SideNav open={navOpen} onClose={() => setNavOpen(false)} />
    </header>
  );
}
