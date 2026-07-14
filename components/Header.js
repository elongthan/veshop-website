"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function Header({ settings }) {
  const router = useRouter();

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
          <input name="q" placeholder="Search products, SKU, brand, keyword..." />
        </form>
      </div>
    </header>
  );
}
