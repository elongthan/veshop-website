"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { slugify } from "@/lib/slug";

export default function SideNav({ open, onClose }) {
  const [tree, setTree] = useState(null);

  useEffect(() => {
    if (!open || tree) return;
    (async () => {
      const supabase = createPublicClient();
      const { data } = await supabase.from("categories").select("*").order("name");
      const rows = data || [];
      const byId = {};
      rows.forEach((c) => (byId[c.id] = { ...c, children: [] }));
      const top = [];
      rows.forEach((c) => {
        if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].children.push(byId[c.id]);
        else top.push(byId[c.id]);
      });
      setTree(top);
    })();
  }, [open, tree]);

  return (
    <>
      {open && <div className="ve-sidenav-backdrop" onClick={onClose} />}
      <aside className={`ve-sidenav ${open ? "open" : ""}`}>
        <div className="ve-sidenav-head">
          <strong>Categories</strong>
          <button onClick={onClose} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="ve-sidenav-body">
          <Link href="/shop" onClick={onClose} className="ve-sidenav-all">Full catalog</Link>
          {!tree && <p className="ve-muted" style={{ padding: "0 16px" }}>Loading...</p>}
          {tree?.map((c) => (
            <div key={c.id} className="ve-sidenav-group">
              <Link href={`/category/${slugify(c.name)}`} onClick={onClose} className="ve-sidenav-cat">
                {c.icon_url && <img src={c.icon_url} alt="" />}
                {c.name}
              </Link>
              {c.children.map((sub) => (
                <Link key={sub.id} href={`/category/${slugify(sub.name)}`} onClick={onClose} className="ve-sidenav-sub">
                  {sub.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
