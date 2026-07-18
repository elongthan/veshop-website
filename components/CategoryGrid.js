"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Package } from "lucide-react";
import { slugify } from "@/lib/slug";

export default function CategoryGrid({ categoryTree }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="ve-cat-grid">
      {categoryTree.map((c) => (
        <div key={c.id} className="ve-cat-tile-wrap">
          <div className="ve-cat-tile">
            <Link href={`/category/${slugify(c.name)}`} className="ve-cat-tile-link">
              <span className="ve-cat-img">
                {c.icon_url ? (
                  <img src={c.icon_url} alt="" />
                ) : (
                  <Package size={28} strokeWidth={1.3} />
                )}
              </span>
              <span className="ve-cat-name">{c.name}</span>
            </Link>
            {c.children.length > 0 && (
              <button
                type="button"
                className={`ve-cat-sub-toggle ${openId === c.id ? "open" : ""}`}
                onClick={() => setOpenId(openId === c.id ? null : c.id)}
              >
                {c.children.length} subcategor{c.children.length === 1 ? "y" : "ies"}
                <ChevronDown size={15} />
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
