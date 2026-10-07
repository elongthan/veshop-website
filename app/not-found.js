import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSettings, getCategoryTree } from "@/lib/data";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true }
};

export default async function NotFound() {
  // Never let a database hiccup turn the 404 page into a second error.
  let settings = { show_prices: true };
  let categories = [];
  try { settings = (await getSettings()) || settings; } catch {}
  try { categories = (await getCategoryTree()).slice(0, 8); } catch {}

  return (
    <>
      <Header settings={settings} />
      <main className="ve-simple-page ve-notfound">
        <p className="ve-notfound-code">404</p>
        <h1>We can't find that page</h1>
        <p className="ve-muted">
          The link may be out of date, or the item may no longer be in our catalogue. Try a search, or browse by category.
        </p>

        <form action="/shop" method="get" className="ve-notfound-search" role="search">
          <input type="search" name="q" placeholder="Search products, brands or SKUs" aria-label="Search products" />
          <button type="submit" className="ve-btn ve-btn-primary">Search</button>
        </form>

        {categories.length > 0 && (
          <div className="ve-notfound-cats">
            {categories.map((c) => (
              <Link key={c.id} href={`/category/${slugify(c.name)}`}>{c.name}</Link>
            ))}
          </div>
        )}

        <p style={{ marginTop: 24 }}>
          <Link href="/" className="ve-btn ve-btn-ghost">Back to home</Link>{" "}
          <Link href="/contact" className="ve-btn ve-btn-ghost">Contact us</Link>
        </p>
      </main>
      <Footer settings={settings} />
    </>
  );
}
