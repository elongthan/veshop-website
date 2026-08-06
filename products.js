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

export async function scanPossiblyTruncated() {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data, error } = await supabase
    .from("products")
    .select("id, name, short_description, image_url")
    .not("short_description", "is", null)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);

  // A short_description that doesn't end in normal sentence punctuation is
  // very likely cut off mid-sentence — this is how the 400-character export
  // truncation from the old site shows up (e.g. "...secure support, and confid").
  const endsCleanly = /[.!?"')]\s*$/;
  return data
    .filter((p) => {
      const text = (p.short_description || "").trim();
      return text.length > 0 && !endsCleanly.test(text);
    })
    .map((p) => ({ id: p.id, name: p.name, image_url: p.image_url, snippet: (p.short_description || "").slice(-60) }));
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

  let oldName = null;
  if (fields.name) {
    const { data: current } = await supabase.from("categories").select("name").eq("id", id).single();
    oldName = current?.name;
  }

  const { error } = await supabase.from("categories").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  // Products store category names as plain text, not a foreign key to this
  // table, so renaming a category here wouldn't otherwise reach products
  // that were already tagged with the old name — fix those up now.
  if (oldName && fields.name && oldName !== fields.name) {
    const { data: allProducts } = await supabase.from("products").select("id, category, categories");
    const toFix = (allProducts || []).filter(
      (p) => p.category === oldName || (p.categories || []).includes(oldName)
    );
    for (const p of toFix) {
      await supabase.from("products").update({
        category: p.category === oldName ? fields.name : p.category,
        categories: (p.categories || []).map((c) => (c === oldName ? fields.name : c))
      }).eq("id", p.id);
    }
  }

  revalidatePath("/admin/taxonomy");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function scanOrphanedCategoryNames() {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const [{ data: cats }, { data: products }] = await Promise.all([
    supabase.from("categories").select("name"),
    supabase.from("products").select("category, categories")
  ]);
  const validNames = new Set((cats || []).map((c) => c.name));

  const counts = {};
  for (const p of products || []) {
    const names = new Set([p.category, ...(p.categories || [])].filter(Boolean));
    for (const n of names) {
      if (!validNames.has(n)) counts[n] = (counts[n] || 0) + 1;
    }
  }
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

export async function mergeCategoryName(oldName, newName) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { data: allProducts, error: fetchErr } = await supabase.from("products").select("id, category, categories");
  if (fetchErr) throw new Error(fetchErr.message);

  const toFix = (allProducts || []).filter(
    (p) => p.category === oldName || (p.categories || []).includes(oldName)
  );
  for (const p of toFix) {
    const { error } = await supabase.from("products").update({
      category: p.category === oldName ? newName : p.category,
      categories: (p.categories || []).map((c) => (c === oldName ? newName : c))
    }).eq("id", p.id);
    if (error) throw new Error(error.message);
  }
  revalidateCatalog();
  return toFix.length;
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
