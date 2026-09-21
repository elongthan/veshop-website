import { getBrands, getCategories, getProducts, getSettings } from "@/lib/data";
import { getMyRole } from "@/actions/adminUsers";
import ProductsClient from "@/components/admin/ProductsClient";

export default async function AdminProductsPage() {
  const [products, categories, brands, settings, role] = await Promise.all([
    getProducts({ includeInactive: true }), getCategories(), getBrands(), getSettings(), getMyRole()
  ]);

  return (
    <ProductsClient products={products} categories={categories} brands={brands} watermarkLogo={settings.logo_url} role={role} />
  );
}
