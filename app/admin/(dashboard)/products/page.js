import { getBrands, getCategories, getProducts } from "@/lib/data";
import ProductsClient from "@/components/admin/ProductsClient";

export default async function AdminProductsPage() {
  const [products, categories, brands] = await Promise.all([
    getProducts(), getCategories(), getBrands()
  ]);

  return (
    <ProductsClient products={products} categories={categories} brands={brands} />
  );
}
