import Link from "next/link";
import { ImageOff } from "lucide-react";
import { fmtPrice } from "@/lib/slug";

export default function ProductCard({ product, showPrices }) {
  return (
    <Link href={`/product/${product.id}`} className="ve-card">
      <div className="ve-card-img">
        {product.new_arrival && <span className="ve-corner-tag">New</span>}
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <div className="ve-img-fallback"><ImageOff size={28} strokeWidth={1.4} /></div>
        )}
      </div>
      <div className="ve-card-body">
        <div className="ve-card-brand">{product.brand || "—"}</div>
        <h3 className="ve-card-title">{product.name}</h3>
        <p className="ve-card-desc">{product.short_description}</p>
        <div className="ve-card-foot">
          {showPrices ? (
            <span className="ve-card-price">{fmtPrice(product.price)}</span>
          ) : (
            <span className="ve-card-price ve-card-price-muted">Price on request</span>
          )}
          <span className="ve-card-sku">{product.sku}</span>
        </div>
      </div>
    </Link>
  );
}
