import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import PrintCatalogButton from "@/components/PrintCatalogButton";
import { getCategories, getProducts, getSettings } from "@/lib/data";
import { slugify } from "@/lib/slug";

export async function generateMetadata({ params }) {
  const categories = await getCategories();
  const category = categories.find((c) => slugify(c) === params.slug);
  if (!category) return {};
  return {
    title: category,
    description: `Browse ${category} products from VeShop — Vertex Enterprise's hardware and safety supplies catalog in Singapore.`,
    alternates: { canonical: `https://veshop.com.sg/category/${params.slug}` }
  };
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }) {
  const [categories, products, settings] = await Promise.all([
    getCategories(), getProducts(), getSettings()
  ]);
  const category = categories.find((c) => slugify(c) === params.slug);
  if (!category) notFound();

  const items = products.filter((p) => p.categories?.includes(category));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://veshop.com.sg/" },
      { "@type": "ListItem", position: 2, name: category, item: `https://veshop.com.sg/category/${params.slug}` }
    ]
  };

  return (
    <>
      <Header settings={settings} />
      <main className="ve-shop">
        <div className="ve-breadcrumb">
          <Link href="/">Home</Link> / {category}
        </div>
        <div className="ve-shop-toolbar">
          <div>
            <h1>{category}</h1>
            <p className="ve-muted">{items.length} items</p>
          </div>
          <div className="ve-shop-toolbar-actions">
            <Link className="ve-btn ve-btn-ghost ve-btn-sm" href={`/shop?category=${encodeURIComponent(category)}`}>
              Search and filter this category
            </Link>
            {items.length > 0 && (
              <PrintCatalogButton
                products={items}
                categoryLabel={category}
                showPrices={settings.show_prices}
                settings={settings}
              />
            )}
          </div>
        </div>
        {items.length === 0 ? (
          <p className="ve-muted">No products in this category yet.</p>
        ) : (
          <div className="ve-grid">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} showPrices={settings.show_prices} />
            ))}
          </div>
        )}
      </main>
      <Footer settings={settings} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
