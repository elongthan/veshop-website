import { createClient } from "@/lib/supabase/server";

export async function getSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  return data || { show_prices: true };
}

export async function getProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getProduct(id) {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  return data;
}

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return (data || []).map((c) => c.name);
}

export async function getBrands() {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").order("name");
  return (data || []).map((b) => b.name);
}
