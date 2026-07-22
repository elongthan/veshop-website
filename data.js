import { createPublicClient } from "@/lib/supabase/public";

function normalizeProduct(p) {
  const categories = p.categories?.length ? p.categories : (p.category ? [p.category] : []);
  const images = p.images?.length ? p.images : (p.image_url ? [p.image_url] : []);
  return { ...p, categories, images, category: categories[0] || "", image_url: images[0] || "" };
}

export async function getSettings() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  return data || { show_prices: true };
}

export async function getProducts({ includeInactive = false } = {}) {
  const supabase = createPublicClient();
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (!includeInactive) query = query.eq("active", true);
  const { data } = await query;
  return (data || []).map(normalizeProduct);
}

export async function getProduct(id, { includeInactive = false } = {}) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  if (!data) return null;
  if (!includeInactive && data.active === false) return null;
  return normalizeProduct(data);
}

// Full category rows (id, name, parent_id, icon_url) for admin / tree use
export async function getCategoryRows() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return data || [];
}

// Flat list of category names (back-compat for simple pickers/filters)
export async function getCategories() {
  const rows = await getCategoryRows();
  return rows.map((c) => c.name);
}

// Top-level categories with their subcategories nested under `children`
export async function getCategoryTree() {
  const rows = await getCategoryRows();
  const byId = {};
  rows.forEach((c) => (byId[c.id] = { ...c, children: [] }));
  const top = [];
  rows.forEach((c) => {
    if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].children.push(byId[c.id]);
    else top.push(byId[c.id]);
  });
  return top;
}

export async function getBrandRows() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("brands").select("*").order("name");
  return data || [];
}

export async function getBrands() {
  const rows = await getBrandRows();
  return rows.map((b) => b.name);
}
