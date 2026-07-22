"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import sharp from "sharp";

async function requireAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
}

async function watermarkBuffer(imageBuffer, logoUrl) {
  try {
    const logoRes = await fetch(logoUrl);
    if (!logoRes.ok) return imageBuffer;
    const logoBuffer = Buffer.from(await logoRes.arrayBuffer());

    const base = sharp(imageBuffer).rotate();
    const meta = await base.metadata();
    const width = meta.width || 800;
    const wmWidth = Math.round(width * 0.35);

    // Resize the logo, then manually cut its alpha channel to ~50% so it
    // sits subtly on top of the product photo instead of fully opaque.
    const { data, info } = await sharp(logoBuffer)
      .resize({ width: wmWidth })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 3; i < data.length; i += 4) {
      data[i] = Math.round(data[i] * 0.18);
    }
    const fadedLogo = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 }
    }).png().toBuffer();

    return await base
      .composite([{ input: fadedLogo, gravity: "center" }])
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch (e) {
    return imageBuffer;
  }
}

export async function importProduct(item) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  if (item.sku) {
    const { data: existing } = await supabase
      .from("products")
      .select("id, images")
      .eq("sku", item.sku)
      .maybeSingle();
    if (existing) {
      // Product already exists — refresh its text fields (useful when a
      // later batch adds info like a fuller description) without
      // re-downloading photos it already has.
      const { error: updErr } = await supabase.from("products").update({
        name: item.name,
        brand: item.brand || null,
        category: item.category || null,
        categories: item.category ? [item.category] : [],
        price: Number(item.price) || 0,
        short_description: item.shortDescription || "",
        description: item.description || ""
      }).eq("id", existing.id);
      if (updErr) return { ok: false, name: item.name, error: updErr.message };
      revalidatePath("/");
      revalidatePath("/shop");
      return { ok: true, updated: true, name: item.name };
    }
  }

  const { data: settingsRow } = await supabase.from("settings").select("logo_url").eq("id", 1).single();
  const logoUrl = settingsRow?.logo_url || null;

  const sourceUrls = item.imageUrls?.length ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []);
  const uploadedUrls = [];

  for (const src of sourceUrls) {
    try {
      const res = await fetch(src);
      if (!res.ok) continue;
      let buffer = Buffer.from(await res.arrayBuffer());
      if (logoUrl) buffer = await watermarkBuffer(buffer, logoUrl);

      const path = `products/import-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, buffer, { contentType: "image/jpeg" });
      if (!upErr) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }
    } catch (e) {
      // this particular photo failed — continue with the rest
    }
  }

  if (uploadedUrls.length === 0) {
    return { ok: false, name: item.name, error: "No image could be downloaded" };
  }

  const payload = {
    sku: item.sku || null,
    name: item.name,
    brand: item.brand || null,
    category: item.category || null,
    categories: item.category ? [item.category] : [],
    price: Number(item.price) || 0,
    short_description: item.shortDescription || "",
    description: item.description || "",
    tags: [],
    image_url: uploadedUrls[0],
    images: uploadedUrls,
    active: true
  };

  const { error } = await supabase.from("products").insert(payload);
  if (error) return { ok: false, name: item.name, error: error.message };

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  return { ok: true, name: item.name };
}
