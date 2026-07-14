import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShopClient from "@/components/ShopClient";
import { getBrands, getCategories, getProducts, getSettings } from "@/lib/data";

export const metadata = {
  title: "Full catalog",
  description: "Search and filter VeShop's full range of hardware, PPE and safety supplies by name, brand, category and price."
};

export default async function ShopPage() {
  const [products, categories, brands, settings] = await Promise.all([
    getProducts(),
    getCategories(),
    getBrands(),
    getSettings()
  ]);

  return (
    <>
      <Header />
      <ShopClient
        products={products}
        categories={categories}
        brands={brands}
        showPrices={settings.show_prices}
      />
      <Footer />
    </>
  );
}
