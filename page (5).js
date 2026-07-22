import { getSettings } from "@/lib/data";
import SettingsClient from "@/components/admin/SettingsClient";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return <SettingsClient initialShowPrices={settings.show_prices} />;
}
