import ImportClient from "@/components/admin/ImportClient";
import { getCategories } from "@/lib/data";

export default async function AdminImportPage() {
  const categories = await getCategories();
  return <ImportClient categories={categories} />;
}
