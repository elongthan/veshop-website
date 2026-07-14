import { getSettings } from "@/lib/data";
import SiteContentClient from "@/components/admin/SiteContentClient";

export default async function AdminSiteContentPage() {
  const settings = await getSettings();
  return <SiteContentClient settings={settings} />;
}
