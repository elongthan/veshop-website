import { getBrands, getCategories, getProducts, getSettings } from "@/lib/data";
import { getMyRole } from "@/actions/adminUsers";
import ProductsClient from "@/components/admin/ProductsClient";

export default async function AdminProductsPage() {
  const [products, categories, brands, settings, role] = await Promise.all([
    getProducts({ includeInactive: true }), getCategories(), getBrands(), getSettings(), getMyRole()
  ]);

  // The list only needs the short version of each product. The long fields (description,
  // variants) are loaded when a product is opened for editing, which keeps this page light.
  const light = products.map(({ description, short_description, variants, variant_columns, ...rest }) => rest);

  return (
    <ProductsClient products={light} categories={categories} brands={brands} watermarkLogo={settings.logo_url} role={role} />
  );
}
