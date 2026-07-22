import Link from "next/link";
import { ImageOff } from "lucide-react";
import { PriceTag } from "@/components/PriceTag";

export default function ProductCard({ product, showPrices }) {
  const onSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  return (
    <Link href={`/product/${product.id}`} className="ve-card">
      <div className="ve-card-img">
        {onSale && <span className="ve-corner-tag ve-corner-tag-sale">Sale</span>}
        {!onSale && product.new_arrival && <span className="ve-corner-tag">New</span>}
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
          <PriceTag product={product} showPrices={showPrices} />
          <span className="ve-card-sku">{product.sku}</span>
        </div>
      </div>
    </Link>
  );
}
