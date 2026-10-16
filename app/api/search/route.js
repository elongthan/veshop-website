import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

const MAX_RESULTS = 8;

// Words are cleaned so they can't break the database filter syntax.
function cleanWords(q) {
  return String(q || "")
    .replace(/[%*,()\\"'`;:]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((w) => w.slice(0, 40));
}

export async function GET(request) {
  const q = new URL(request.url).searchParams.get("q") || "";
  const words = cleanWords(q);
  const headers = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
  if (q.trim().length < 2 || words.length === 0) return NextResponse.json({ results: [] }, { headers });

  try {
    const supabase = createPublicClient();
    let query = supabase.from("products").select("*").eq("active", true);
    // Every typed word must appear in the name, SKU, brand or short description.
    for (const w of words) {
      query = query.or(`name.ilike."%${w}%",sku.ilike."%${w}%",brand.ilike."%${w}%",short_description.ilike."%${w}%"`);
    }
    const [{ data }, { data: settings }] = await Promise.all([
      query.limit(40),
      supabase.from("settings").select("show_prices").eq("id", 1).single()
    ]);
    const showPrices = settings?.show_prices !== false;
    const first = words[0].toLowerCase();

    const rows = (data || [])
      // names that start with the typed word first, then names containing it, then the rest
      .map((p) => {
        const name = (p.name || "").toLowerCase();
        return { p, rank: name.startsWith(first) ? 0 : name.includes(first) ? 1 : 2 };
      })
      .sort((a, b) => a.rank - b.rank || (a.p.name || "").localeCompare(b.p.name || ""))
      .slice(0, MAX_RESULTS)
      .map(({ p }) => {
        const image = p.images?.length ? p.images[0] : p.image_url || "";
        const onSale = p.sale_price != null && Number(p.sale_price) < Number(p.price);
        return {
          id: p.id,
          name: p.name,
          sku: p.sku || "",
          brand: p.brand || "",
          image,
          price: showPrices ? (onSale ? Number(p.sale_price) : p.price != null ? Number(p.price) : null) : null
        };
      });

    return NextResponse.json({ results: rows, showPrices }, { headers });
  } catch {
    // Search suggestions are a convenience — never show an error for them.
    return NextResponse.json({ results: [] });
  }
}
