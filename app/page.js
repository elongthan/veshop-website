import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";
import BrandTicker from "@/components/BrandTicker";
import { getBrandRows, getCategoryTree, getProducts, getSettings } from "@/lib/data";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categoryTree, products, settings, brands] = await Promise.all([
    getCategoryTree(),
    getProducts(),
    getSettings(),
    getBrandRows()
  ]);
  const recent = products.slice(0, 8);
  const totalCategories = categoryTree.reduce((n, c) => n + 1 + c.children.length, 0);

  return (
    <>
      <Header settings={settings} />
      <main>
        {settings.banner_images?.length > 0 && <BannerCarousel images={settings.banner_images} />}

        <section className="ve-hero">
          <div className="ve-hero-copy">
            <span className="ve-eyebrow">{settings.hero_eyebrow}</span>
            <h1>{settings.hero_title}</h1>
            <p>{settings.hero_description}</p>
            <div className="ve-hero-actions">
              <Link className="ve-btn ve-btn-primary" href="/shop">Browse catalog</Link>
              <a className="ve-btn ve-btn-ghost" href="#categories">View by category</a>
            </div>
          </div>
          <div className="ve-hero-panel" aria-hidden="true">
            <div className="ve-hero-stripe" />
            <div className="ve-hero-stat"><strong>{products.length}</strong><span>items listed</span></div>
            <div className="ve-hero-stat"><strong>{totalCategories}</strong><span>categories</span></div>
          </div>
        </section>

        <section id="categories" className="ve-section">
          <div className="ve-section-head"><h2>Shop by category</h2></div>
          <div className="ve-cat-grid">
            {categoryTree.map((c, i) => (
              <Link key={c.id} href={`/category/${slugify(c.name)}`} className="ve-cat-tile">
                {c.icon_url ? (
                  <img src={c.icon_url} alt="" className="ve-cat-icon" />
                ) : (
                  <span className="ve-cat-index">{String(i + 1).padStart(2, "0")}</span>
                )}
                <span>
                  {c.name}
                  {c.children.length > 0 && <em className="ve-cat-sub-count"> · {c.children.length} sub</em>}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="ve-section">
          <div className="ve-section-head">
            <h2>Recently added</h2>
            <Link className="ve-link" href="/shop">View all →</Link>
          </div>
          <div className="ve-grid">
            {recent.map((p) => (
              <ProductCard key={p.id} product={p} showPrices={settings.show_prices} />
            ))}
          </div>
        </section>

        {brands.length > 0 && (
          <section className="ve-section">
            <div className="ve-section-head"><h2>Brands we carry</h2></div>
            <BrandTicker brands={brands} />
          </section>
        )}
      </main>
      <Footer settings={settings} />
    </>
  );
}
