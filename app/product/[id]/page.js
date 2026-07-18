import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import ShareButton from "@/components/ShareButton";
import { getProduct, getSettings } from "@/lib/data";
import { fmtPrice, slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);
  if (!product) return {};
  return {
    title: product.name,
    description: product.short_description || `${product.name} — available from VeShop, Vertex Enterprise Pte Ltd.`,
    openGraph: {
      title: product.name,
      description: product.short_description,
      images: product.images?.length ? product.images : []
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
    image: product.images?.length ? product.images : undefined,
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
      <Header settings={settings} />
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
          <ProductGallery images={product.images} name={product.name} />
          <div className="ve-product-info">
            <div className="ve-card-brand">{product.brand || "—"}</div>
            <h1>{product.name}</h1>
            <div className="ve-product-meta">
              <span>SKU {product.sku || "—"}</span>
              <span>{product.categories?.join(", ") || product.category}</span>
            </div>
            {settings.show_prices ? (
              <div className="ve-product-price">{fmtPrice(product.price)} <small>(GST incl.)</small></div>
            ) : (
              <div className="ve-product-price ve-card-price-muted">Price on request — contact us</div>
            )}
            <p className="ve-product-desc">{product.short_description}</p>
            <div className="ve-product-actions">
              <a
                className="ve-btn ve-btn-primary"
                href={`mailto:${settings.contact_email || "sales@veshop.com.sg"}?subject=Enquiry: ${encodeURIComponent(product.name)}`}
              >
                Enquire about this item
              </a>
              <ShareButton title={product.name} />
            </div>
          </div>
        </div>
      </main>
      <Footer settings={settings} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
