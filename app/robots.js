import { headers } from "next/headers";

export default async function robots() {
  const host = (await headers()).get("host") || "";
  const isLiveDomain = host.includes("veshop.com.sg");

  if (!isLiveDomain) {
    // Not yet on the real domain (e.g. still on the *.vercel.app preview
    // URL while testing) — block all crawling so this temporary address
    // never gets indexed and competes with the real site later.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin/" }],
    sitemap: "https://veshop.com.sg/sitemap.xml"
  };
}
