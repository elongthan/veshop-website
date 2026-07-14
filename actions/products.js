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

  const payload = {
    sku: product.sku || null,
    name: product.name,
    brand: product.brand || null,
    category: product.category || null,
    price: Number(product.price) || 0,
    short_description: product.shortDescription || "",
    tags: product.tags || [],
    image_url: product.imageUrl || null,
    new_arrival: !!product.newArrival
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

export async function addCategory(name) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("categories").insert({ name });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/shop");
}

export async function removeCategory(name) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("categories").delete().eq("name", name);
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

export async function removeBrand(name) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  const { error } = await supabase.from("brands").delete().eq("name", name);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomy");
  revalidatePath("/shop");
}
