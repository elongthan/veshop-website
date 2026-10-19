import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShopClient from "@/components/ShopClient";
import { getBrands, getCategoryTree, getProducts, getSettings } from "@/lib/data";

// Saved copy of this page, refreshed at most every 5 minutes (and straight away when
// something is saved in admin) — avoids rebuilding the page on every visit.
export const revalidate = 300;

export const metadata = {
  title: "Full catalogue",
  description: "Search and filter VeShop's full range of hardware, PPE and safety supplies by name, brand, category and price.",
  alternates: { canonical: "https://www.veshop.com.sg/shop" }
};

export default async function ShopPage() {
  const [products, categoryTree, brands, settings] = await Promise.all([
    getProducts(),
    getCategoryTree(),
    getBrands(),
    getSettings()
  ]);

  return (
    <>
      <Header settings={settings} />
      <ShopClient
        products={products}
        categoryTree={categoryTree}
        brands={brands}
        showPrices={settings.show_prices}
        settings={settings}
      />
      <Footer settings={settings} />
    </>
  );
}
