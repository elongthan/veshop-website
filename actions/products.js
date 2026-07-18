"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
    name: product.name,
    brand: product.brand || null,
    category: categories[0],
    categories,
    price: Number(product.price) || 0,
    short_description: product.shortDescription || "",
    tags: product.tags || [],
    image_url: images[0],
    images,
    new_arrival: !!product.newArrival,
    active: product.active !== false
  };

  if (product.id) {
    const { error } = await supabase.from("products").update(payload).eq("id", product.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("products").insert(payload);
    if (error) throw new Error(error.message);
  }
  revalidateCatalog();
}

export async function deleteProduct(id) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("products").delete().eq("id", id);
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
