import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms & Conditions",
  description: "Terms of use for the Vertex Enterprise Pte Ltd (VeShop) website."
};

export default async function TermsPage() {
  const settings = await getSettings();

  return (
    <>
      <Header settings={settings} />
      <main className="ve-simple-page ve-legal-page">
        <h1>Terms &amp; Conditions</h1>
        <p className="ve-muted">Last updated: {new Date().toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}</p>

        <p>
          These terms govern your use of this website (veshop.com.sg),
          operated by Vertex Enterprise Pte Ltd ("we", "us", "our"). By using
          this website, you agree to these terms.
        </p>

        <h2>About this website</h2>
        <p>
          This website is a product catalog for browsing our range of
          hardware, PPE, and safety supplies. It does not process online
          orders or payments. To place an order, request a quote, or arrange
          bulk purchasing, please contact us directly using the details on
          our Contact Us page.
        </p>

        <h2>Product information and pricing</h2>
        <p>
          We aim to keep product descriptions, images, and prices accurate
          and up to date. However, product images are for illustrative
          purposes and actual products may vary slightly. Prices displayed
          are subject to change without notice, and final pricing for any
          order is confirmed directly with our sales team at the time of
          purchase.
        </p>

        <h2>Stock availability</h2>
        <p>
          Products marked as available are subject to actual stock on hand
          at the time of your order. We will inform you if an item you've
          enquired about is unavailable or has a longer lead time.
        </p>

        <h2>Intellectual property</h2>
        <p>
          All content on this website, including text, images, and logos,
          is the property of Vertex Enterprise Pte Ltd or its respective
          brand owners, and may not be reproduced without permission.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          While we make reasonable efforts to keep this website accurate and
          available, we do not guarantee it will be free of errors or
          uninterrupted, and we are not liable for any loss arising from
          your use of, or inability to use, this website.
        </p>

        <h2>Governing law</h2>
        <p>These terms are governed by the laws of Singapore.</p>

        <h2>Contact us</h2>
        <p>
          Questions about these terms can be sent to{" "}
          our <a href="/contact">Contact Us</a> page.
        </p>
      </main>
      <Footer settings={settings} />
    </>
  );
}
