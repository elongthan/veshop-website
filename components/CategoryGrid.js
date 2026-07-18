"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { slugify } from "@/lib/slug";

export default function CategoryGrid({ categoryTree }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="ve-cat-grid">
      {categoryTree.map((c, i) => (
        <div key={c.id} className="ve-cat-tile-wrap">
          <div className="ve-cat-tile">
            <Link href={`/category/${slugify(c.name)}`} className="ve-cat-tile-link">
              {c.icon_url ? (
                <img src={c.icon_url} alt="" className="ve-cat-icon" />
              ) : (
                <span className="ve-cat-index">{String(i + 1).padStart(2, "0")}</span>
              )}
              <span>{c.name}</span>
            </Link>
            {c.children.length > 0 && (
              <button
                type="button"
                className={`ve-cat-expand ${openId === c.id ? "open" : ""}`}
                onClick={() => setOpenId(openId === c.id ? null : c.id)}
                aria-label={`Show subcategories of ${c.name}`}
              >
                <ChevronDown size={16} />
              </button>
            )}
          </div>
          {openId === c.id && c.children.length > 0 && (
            <div className="ve-cat-subdrop">
              {c.children.map((sub) => (
                <Link key={sub.id} href={`/category/${slugify(sub.name)}`}>
                  {sub.icon_url && <img src={sub.icon_url} alt="" />}
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
