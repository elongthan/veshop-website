import { redirect } from "next/navigation";
import { getSettings } from "@/lib/data";
import { getMyRole } from "@/actions/adminUsers";
import SiteContentClient from "@/components/admin/SiteContentClient";

export default async function AdminSiteContentPage() {
  if ((await getMyRole()) === "staff") redirect("/admin/products");
  const settings = await getSettings();
  return <SiteContentClient settings={settings} />;
}
