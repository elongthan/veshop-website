import { redirect } from "next/navigation";
import { getBrandRows, getCategoryRows } from "@/lib/data";
import { getMyRole } from "@/actions/adminUsers";
import TaxonomyClient from "@/components/admin/TaxonomyClient";

export default async function AdminTaxonomyPage() {
  if ((await getMyRole()) === "staff") redirect("/admin/products");
  const [categories, brands] = await Promise.all([getCategoryRows(), getBrandRows()]);
  return <TaxonomyClient categories={categories} brands={brands} />;
}
