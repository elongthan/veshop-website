import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";
import CategoryGrid from "@/components/CategoryGrid";
import BrandTicker from "@/components/BrandTicker";
import { getBrandRows, getCategoryTree, getProducts, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categoryTree, products, settings, brands] = await Promise.all([
    getCategoryTree(),
    getProducts(),
    getSettings(),
    getBrandRows()
  ]);
  const featured = products.filter((p) => p.new_arrival);
  const others = products.filter((p) => !p.new_arrival);
  const recent = [...featured, ...others].slice(0, 8);

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Vertex Enterprise Pte Ltd",
    url: "https://veshop.com.sg",
    telephone: settings.phone1 || undefined,
    address: settings.footer_address ? { "@type": "PostalAddress", streetAddress: settings.footer_address, addressCountry: "SG" } : undefined,
    image: settings.logo_url || undefined
  };

  return (
    <>
      <Header settings={settings} />
      <main>
        {settings.banner_images?.length > 0 && <BannerCarousel images={settings.banner_images} />}

        <section className="ve-section">
          <div className="ve-section-head">
            <h2>{settings.featured_section_heading || "Featured Products"}</h2>
            <Link className="ve-link" href="/shop">View all →</Link>
          </div>
          <div className="ve-grid">
            {recent.map((p) => (
              <ProductCard key={p.id} product={p} showPrices={settings.show_prices} />
            ))}
          </div>
        </section>

        <section id="categories" className="ve-section">
          <div className="ve-section-head"><h2>Shop by category</h2></div>
          <CategoryGrid categoryTree={categoryTree} />
        </section>

        {brands.length > 0 && (
          <section className="ve-section">
            <div className="ve-section-head"><h2>Brands we carry</h2></div>
            <BrandTicker brands={brands} />
          </section>
        )}

        <section className="ve-intro">
          <h1>{settings.hero_title}</h1>
          <p>{settings.hero_description}</p>
        </section>
      </main>
      <Footer settings={settings} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
    </>
  );
}
