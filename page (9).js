import { getBrandRows, getCategoryRows } from "@/lib/data";
import TaxonomyClient from "@/components/admin/TaxonomyClient";

export default async function AdminTaxonomyPage() {
  const [categories, brands] = await Promise.all([getCategoryRows(), getBrandRows()]);
  return <TaxonomyClient categories={categories} brands={brands} />;
}
