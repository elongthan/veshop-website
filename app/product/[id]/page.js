import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProduct, getSettings } from "@/lib/data";
import { fmtPrice, slugify } from "@/lib/slug";
import { ImageOff } from "lucide-react";

export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);
  if (!product) return {};
  return {
    title: product.name,
    description: product.short_description || `${product.name} — available from VeShop, Vertex Enterprise Pte Ltd.`,
    openGraph: {
      title: product.name,
      description: product.short_description,
      images: product.image_url ? [product.image_url] : []
    }
  };
}

export default async function ProductPage({ params }) {
  const [product, settings] = await Promise.all([getProduct(params.id), getSettings()]);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    description: product.short_description,
    image: product.image_url ? [product.image_url] : undefined,
    ...(settings.show_prices
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "SGD",
            price: product.price,
            availability: "https://schema.org/InStock"
          }
        }
      : {})
  };

  return (
    <>
      <Header />
      <main className="ve-product-page">
        <div className="ve-breadcrumb">
          <Link href="/">Home</Link> / {product.category && (
            <>
              <Link href={`/category/${slugify(product.category)}`}>{product.category}</Link> /{" "}
            </>
          )}
          {product.name}
        </div>
        <div className="ve-product-grid">
          <div className="ve-product-img">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} />
            ) : (
              <div className="ve-img-fallback"><ImageOff size={40} strokeWidth={1.2} /></div>
            )}
          </div>
          <div className="ve-product-info">
            <div className="ve-card-brand">{product.brand || "—"}</div>
            <h1>{product.name}</h1>
            <div className="ve-product-meta">
              <span>SKU {product.sku || "—"}</span>
              <span>{product.category}</span>
            </div>
            {settings.show_prices ? (
              <div className="ve-product-price">{fmtPrice(product.price)} <small>(GST incl.)</small></div>
            ) : (
              <div className="ve-product-price ve-card-price-muted">Price on request — contact us</div>
            )}
            <p className="ve-product-desc">{product.short_description}</p>
            {product.tags?.length > 0 && (
              <div className="ve-tag-row">
                {product.tags.map((t) => <span key={t} className="ve-tag-chip">{t}</span>)}
              </div>
            )}
            <a
              className="ve-btn ve-btn-primary"
              style={{ marginTop: 16 }}
              href={`mailto:sales@veshop.com.sg?subject=Enquiry: ${encodeURIComponent(product.name)}`}
            >
              Enquire about this item
            </a>
          </div>
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
