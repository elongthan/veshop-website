import { redirect } from "next/navigation";
import { getSettings } from "@/lib/data";
import { getMyRole } from "@/actions/adminUsers";
import SettingsClient from "@/components/admin/SettingsClient";

export default async function AdminSettingsPage() {
  if ((await getMyRole()) === "staff") redirect("/admin/products");
  const settings = await getSettings();
  return <SettingsClient initialShowPrices={settings.show_prices} />;
}
