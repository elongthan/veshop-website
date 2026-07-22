import { getBrands, getCategories, getProducts, getSettings } from "@/lib/data";
import ProductsClient from "@/components/admin/ProductsClient";

export default async function AdminProductsPage() {
  const [products, categories, brands, settings] = await Promise.all([
    getProducts({ includeInactive: true }), getCategories(), getBrands(), getSettings()
  ]);

  return (
    <ProductsClient products={products} categories={categories} brands={brands} watermarkLogo={settings.logo_url} />
  );
}
