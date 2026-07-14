import "./globals.css";

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
