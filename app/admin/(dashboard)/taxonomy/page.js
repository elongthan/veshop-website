import { getBrands, getCategories } from "@/lib/data";
import TaxonomyClient from "@/components/admin/TaxonomyClient";

export default async function AdminTaxonomyPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  return <TaxonomyClient categories={categories} brands={brands} />;
}
