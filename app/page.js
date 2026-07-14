import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";
import { getCategories, getProducts, getSettings } from "@/lib/data";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, products, settings] = await Promise.all([
    getCategories(),
    getProducts(),
    getSettings()
  ]);
  const recent = products.slice(0, 8);

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
            <div className="ve-hero-stat"><strong>{categories.length}</strong><span>categories</span></div>
          </div>
        </section>

        <section id="categories" className="ve-section">
          <div className="ve-section-head"><h2>Shop by category</h2></div>
          <div className="ve-cat-grid">
            {categories.map((c, i) => (
              <Link key={c} href={`/category/${slugify(c)}`} className="ve-cat-tile">
                <span className="ve-cat-index">{String(i + 1).padStart(2, "0")}</span>
                <span>{c}</span>
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
      </main>
      <Footer settings={settings} />
    </>
  );
}
