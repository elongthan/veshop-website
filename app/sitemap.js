import { getCategories, getProducts } from "@/lib/data";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const base = "https://veshop.com.sg";
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  const staticPages = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 }
  ];

  const categoryPages = categories.map((c) => ({
    url: `${base}/category/${slugify(c)}`,
    changeFrequency: "weekly",
    priority: 0.7
  }));

  const productPages = products.map((p) => ({
    url: `${base}/product/${p.id}`,
    changeFrequency: "weekly",
    priority: 0.6
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
