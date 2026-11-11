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
    // "/contact?" are the per-product enquiry links (/contact?product=...): they all show the
    // same page, so crawlers don't need to visit each one.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/contact?"] }],
    sitemap: "https://www.veshop.com.sg/sitemap.xml"
  };
}
