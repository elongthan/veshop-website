"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Lock, Package, LayoutGrid, Settings, LogOut, Image, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="ve-admin-sidebar">
      <Link className="ve-link ve-back" href="/"><ArrowLeft size={14} /> View site</Link>
      <div className="ve-admin-brand"><Lock size={16} /> Admin portal</div>
      <nav className="ve-admin-nav">
        <Link className={pathname.startsWith("/admin/products") ? "active" : ""} href="/admin/products">
          <Package size={16} /> Products
        </Link>
        <Link className={pathname.startsWith("/admin/site-content") ? "active" : ""} href="/admin/site-content">
          <Image size={16} /> Site content
        </Link>
        <Link className={pathname.startsWith("/admin/import") ? "active" : ""} href="/admin/import">
          <UploadCloud size={16} /> Bulk import
        </Link>
        <Link className={pathname.startsWith("/admin/taxonomy") ? "active" : ""} href="/admin/taxonomy">
          <LayoutGrid size={16} /> Categories &amp; brands
        </Link>
        <Link className={pathname.startsWith("/admin/settings") ? "active" : ""} href="/admin/settings">
          <Settings size={16} /> Settings
        </Link>
      </nav>
      <button className="ve-logout" onClick={signOut}><LogOut size={14} /> Sign out</button>
    </aside>
  );
}
