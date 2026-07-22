"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Menu } from "lucide-react";
import SideNav from "./SideNav";

export default function Header({ settings }) {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  function onSearch(e) {
    e.preventDefault();
    const q = e.target.elements.q.value;
    router.push(`/shop?q=${encodeURIComponent(q)}`);
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
        </nav>
        <form className="ve-search" onSubmit={onSearch}>
          <Search size={16} />
          <input name="q" placeholder="Search products, brands, SKU..." />
        </form>
      </div>
      <SideNav open={navOpen} onClose={() => setNavOpen(false)} />
    </header>
  );
}
