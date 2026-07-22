"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cleanText, hasUncleanText } from "@/lib/textClean";

async function requireAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
}

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

export async function saveProduct(product) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const images = product.images || [];
  const categories = product.categories || [];
  if (images.length === 0) throw new Error("At least one product image is required.");
  if (categories.length === 0) throw new Error("Select at least one category.");

  const payload = {
    sku: product.sku || null,
    name: cleanText(product.name),
    brand: product.brand || null,
    category: categories[0],
    categories,
    price: Number(product.price) || 0,
    sale_price: product.salePrice !== "" && product.salePrice != null ? Number(product.salePrice) : null,
    short_description: cleanText(product.shortDescription) || "",
    description: cleanText(product.description) || "",
    tags: product.tags || [],
    image_url: images[0],
    images,
    new_arrival: !!product.newArrival,
    active: product.active !== false
  };

  if (product.id) {
    const { error } = await supabase.from("products").update(payload).eq("id", product.id);
    if (error) throw new Error(error.message);
    revalidatePath(`/product/${product.id}`);
  } else {
    const { error } = await supabase.from("products").insert(payload);
    if (error) throw new Error(error.message);
  }
  revalidateCatalog();
}

export async function scanUncleanText() {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data, error } = await supabase
    .from("products")
    .select("id, name, short_description, description, image_url")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);

  return data
    .filter((p) => hasUncleanText(p.name) || hasUncleanText(p.short_description) || hasUncleanText(p.description))
    .map((p) => ({ id: p.id, name: p.name, image_url: p.image_url }));
}

export async function fixUncleanText(ids) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data, error } = await supabase
    .from("products")
    .select("id, name, short_description, description")
    .in("id", ids);
  if (error) throw new Error(error.message);

  for (const p of data) {
    const { error: updateError } = await supabase.from("products").update({
      name: cleanText(p.name),
      short_description: cleanText(p.short_description) || "",
      description: cleanText(p.description) || ""
    }).eq("id", p.id);
    if (updateError) throw new Error(updateError.message);
  }
  revalidateCatalog();
  return data.length;
}

export async function deleteProduct(id) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateCatalog();
}

export async function deleteAllProducts() {
  const supabase = await createClient();
  await requireAdmin(supabase);
  // Deletes every product row. Storage photos aren't removed automatically —
  // they're harmless left behind, but you can ignore that for now.
  const { error } = await supabase.from("products").delete().gte("created_at", "1900-01-01");
  if (error) throw new Error(error.message);
  revalidateCatalog();
}

export async function findDuplicateProducts() {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, brand, price, image_url, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  // Group by SKU when present (exact match), otherwise by normalized name +
  // brand — the best available signal for products that never had a SKU.
  const groups = {};
  for (const p of data) {
    const key = p.sku
      ? `sku:${p.sku.trim().toLowerCase()}`
      : `name:${p.name.trim().toLowerCase()}|${(p.brand || "").trim().toLowerCase()}`;
    (groups[key] ||= []).push(p);
  }

  return Object.values(groups).filter((g) => g.length > 1);
}

export async function deleteProducts(ids) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("products").delete().in("id", ids);
  if (error) throw new Error(error.message);
  revalidateCatalog();
}

export async function toggleShowPrices(value) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("settings").update({ show_prices: value }).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidateCatalog();
}

export async function addCategory(name, parentId) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("categories").insert({ name, parent_id: parentId || null });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/shop");
}

export async function updateCategory(id, fields) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("categories").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function removeCategory(id) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/shop");
}

export async function addBrand(name) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("brands").insert({ name });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/shop");
}

export async function updateBrand(id, fields) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("brands").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/");
}

export async function removeBrand(name) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("brands").delete().eq("name", name);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/shop");
}
