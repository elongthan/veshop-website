import { slugify } from "./slug.js";

// Turns database rows into a flat list of every image the site references,
// each with a tidy path to use inside the downloaded zip. Pure function (no
// database or network access) so it can be tested on its own.
//
// Input:  { products, brands, categories, settings }
// Output: [{ url, path, kind, productId, productName, sku }]

function extensionOf(url) {
  try {
    const last = new URL(url).pathname.split("/").pop() || "";
    const match = last.match(/\.([a-zA-Z0-9]{2,5})$/);
    return match ? match[1].toLowerCase() : "jpg";
  } catch {
    return "jpg";
  }
}

function shortSlug(text, fallback) {
  const s = slugify(text || "").slice(0, 40).replace(/-+$/g, "");
  return s || fallback;
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function buildImageList({ products = [], brands = [], categories = [], settings = null }) {
  const items = [];
  const usedUrls = new Set();
  const usedPaths = new Set();

  function add({ url, folder, base, kind, productId = "", productName = "", sku = "" }) {
    if (!isHttpUrl(url) || usedUrls.has(url)) return;
    usedUrls.add(url);

    const ext = extensionOf(url);
    let path = `${folder}/${base}.${ext}`;
    let n = 2;
    while (usedPaths.has(path.toLowerCase())) {
      path = `${folder}/${base}-${n}.${ext}`;
      n++;
    }
    usedPaths.add(path.toLowerCase());
    items.push({ url, path, kind, productId, productName, sku });
  }

  // Site-wide images first (small, and the most painful to lose)
  if (settings?.logo_url) add({ url: settings.logo_url, folder: "site", base: "logo", kind: "site" });
  (settings?.banner_images || []).forEach((url, i) =>
    add({ url, folder: "site", base: `banner-${i + 1}`, kind: "banner" })
  );

  for (const b of brands) {
    add({ url: b.logo_url, folder: "brands", base: shortSlug(b.name, "brand"), kind: "brand", productName: b.name || "" });
  }
  for (const c of categories) {
    add({ url: c.icon_url, folder: "categories", base: shortSlug(c.name, "category"), kind: "category", productName: c.name || "" });
  }

  for (const p of products) {
    // image_url is the cover and is also images[0]; fall back to it only
    // when the images list is empty.
    const urls = Array.isArray(p.images) && p.images.length ? p.images : [p.image_url];
    const idShort = String(p.id || "").slice(0, 8);
    const folder = `products/${shortSlug(p.name, "product")}__${idShort}`;
    urls.forEach((url, i) =>
      add({
        url,
        folder,
        base: `photo-${i + 1}`,
        kind: "product",
        productId: p.id || "",
        productName: p.name || "",
        sku: p.sku || ""
      })
    );
  }

  return items;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

// rows: [{ item, status }]. Leading BOM so Excel reads UTF-8 names correctly.
export function buildManifestCsv(rows) {
  const header = ["file_in_zip", "status", "type", "product_id", "name", "sku", "original_url"];
  const lines = rows.map(({ item, status }) =>
    [item.path, status, item.kind, item.productId, item.productName, item.sku, item.url].map(csvCell).join(",")
  );
  return "\uFEFF" + [header.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}
