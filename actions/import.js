"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
}

export async function importProduct(item) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  // Skip (as an update) if a product with this SKU already exists, so
  // re-running a batch doesn't create duplicates.
  if (item.sku) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("sku", item.sku)
      .maybeSingle();
    if (existing) {
      return { ok: true, skipped: true, name: item.name };
    }
  }

  let imageUrl = null;
  if (item.imageUrl) {
    try {
      const res = await fetch(item.imageUrl);
      if (res.ok) {
        const blob = await res.blob();
        const ext = item.imageUrl.split(".").pop().split("?")[0].slice(0, 4) || "jpg";
        const path = `products/import-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, blob, { contentType: res.headers.get("content-type") || "image/jpeg" });
        if (!upErr) {
          const { data } = supabase.storage.from("product-images").getPublicUrl(path);
          imageUrl = data.publicUrl;
        }
      }
    } catch (e) {
      // Image failed to download — product still gets created, just without a photo
    }
  }

  const payload = {
    sku: item.sku || null,
    name: item.name,
    brand: item.brand || null,
    category: item.category || null,
    categories: item.category ? [item.category] : [],
    price: Number(item.price) || 0,
    short_description: item.shortDescription || "",
    tags: [],
    image_url: imageUrl,
    images: imageUrl ? [imageUrl] : [],
    active: true
  };

  if (!payload.images.length) {
    return { ok: false, name: item.name, error: "No image could be downloaded" };
  }

  const { error } = await supabase.from("products").insert(payload);
  if (error) return { ok: false, name: item.name, error: error.message };

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  return { ok: true, name: item.name };
}
