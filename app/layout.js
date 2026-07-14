import "./globals.css";
import { getSettings } from "@/lib/data";

export const metadata = {
  metadataBase: new URL("https://veshop.com.sg"),
  title: {
    default: "VeShop — Hardware, PPE & Safety Supplies Singapore | Vertex Enterprise",
    template: "%s | VeShop"
  },
  description:
    "Browse VeShop's full catalog of hardware tools, PPE, traffic safety, welding and construction supplies in Singapore. Search by brand, price and category.",
  openGraph: {
    title: "VeShop — Hardware, PPE & Safety Supplies Singapore",
    description: "Vertex Enterprise Pte Ltd's full product catalog — hardware, PPE, tools and more.",
    url: "https://veshop.com.sg",
    siteName: "VeShop",
    locale: "en_SG",
    type: "website"
  }
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const settings = await getSettings();
  const accentColor = settings?.accent_color || "#1B3A6B";

  return (
    <html lang="en">
      <body>
        <style>{`:root{ --signal: ${accentColor}; }`}</style>
        {children}
      </body>
    </html>
  );
}
