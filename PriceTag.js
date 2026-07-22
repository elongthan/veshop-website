import { fmtPrice } from "@/lib/slug";

export function PriceTag({ product, showPrices, size = "card" }) {
  if (!showPrices) {
    return <span className={`ve-card-price ve-card-price-muted`}>Price on request</span>;
  }
  const onSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  if (!onSale) {
    return <span className={size === "detail" ? "ve-product-price" : "ve-card-price"}>{fmtPrice(product.price)}</span>;
  }
  if (size === "detail") {
    return (
      <div className="ve-product-price ve-price-sale">
        <span className="ve-price-was">{fmtPrice(product.price)}</span>
        <span className="ve-price-now">{fmtPrice(product.sale_price)}</span>
        <small>(GST incl.)</small>
      </div>
    );
  }
  return (
    <span className="ve-card-price ve-price-sale">
      <span className="ve-price-was">{fmtPrice(product.price)}</span>
      <span className="ve-price-now">{fmtPrice(product.sale_price)}</span>
    </span>
  );
}
