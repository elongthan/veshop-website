"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function Header() {
  const router = useRouter();

  function onSearch(e) {
    e.preventDefault();
    const q = e.target.elements.q.value;
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="ve-header">
      <div className="ve-hazard-bar" />
      <div className="ve-header-row">
        <Link href="/" className="ve-logo">
          <span className="ve-logo-mark">VE</span>
          <span className="ve-logo-text">
            <strong>VESHOP</strong>
            <em>Vertex Enterprise catalog</em>
          </span>
        </Link>
        <nav className="ve-nav">
          <Link href="/">Home</Link>
          <Link href="/shop">Full catalog</Link>
        </nav>
        <form className="ve-search" onSubmit={onSearch}>
          <Search size={16} />
          <input name="q" placeholder="Search products, SKU, brand..." />
        </form>
      </div>
    </header>
  );
}
