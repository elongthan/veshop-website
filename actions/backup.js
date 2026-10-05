"use server";

import { createClient } from "@/lib/supabase/server";
import { requireFullAdmin } from "@/lib/adminRole";
import { buildImageList } from "@/lib/backupList";

// Supabase returns at most 1000 rows per request, so read in pages — a
// plain select would silently stop at 1000 products.
async function fetchAll(supabase, table, columns) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

export async function listBackupImages() {
  const supabase = await createClient();
  await requireFullAdmin(supabase);

  const [products, brands, categories, settingsRes] = await Promise.all([
    fetchAll(supabase, "products", "id, sku, name, image_url, images"),
    fetchAll(supabase, "brands", "id, name, logo_url"),
    fetchAll(supabase, "categories", "id, name, icon_url"),
    supabase.from("settings").select("logo_url, banner_images").eq("id", 1).maybeSingle()
  ]);
  if (settingsRes.error) throw new Error(settingsRes.error.message);

  return buildImageList({ products, brands, categories, settings: settingsRes.data });
}
