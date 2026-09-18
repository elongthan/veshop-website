import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy Policy",
  description: "How Vertex Enterprise Pte Ltd (VeShop) collects, uses and protects your personal data."
};

export default async function PrivacyPage() {
  const settings = await getSettings();

  return (
    <>
      <Header settings={settings} />
      <main className="ve-simple-page ve-legal-page">
        <h1>Privacy Policy</h1>
        <p className="ve-muted">Last updated: {new Date().toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}</p>

        <p>
          Vertex Enterprise Pte Ltd ("we", "us", "our") operates this website
          (veshop.com.sg). This policy explains what personal data we collect
          when you use our website, why we collect it, and how we handle it,
          in accordance with Singapore's Personal Data Protection Act (PDPA).
        </p>

        <h2>What we collect</h2>
        <p>We collect personal data only when you choose to provide it to us, specifically when you submit an enquiry through our Contact Us form. This may include:</p>
        <ul>
          <li>Your name</li>
          <li>Your email address</li>
          <li>Your phone number (if provided)</li>
          <li>The content of your message</li>
          <li>Any file you choose to attach to your enquiry</li>
        </ul>
        <p>
          We do not require you to create an account to browse this website,
          and we do not process any online payments or store payment
          information — this website is a product catalog, and orders and
          quotes are handled directly between you and our sales team.
        </p>

        <h2>How we use your data</h2>
        <p>We use the information you provide solely to:</p>
        <ul>
          <li>Respond to your enquiry, quote request, or order request</li>
          <li>Contact you regarding products, pricing, or delivery</li>
        </ul>
        <p>We do not sell, rent, or trade your personal data to third parties for marketing purposes.</p>

        <h2>Who we share it with</h2>
        <p>
          To operate this website, we use the following third-party service
          providers, who process data on our behalf under their own security
          and privacy practices:
        </p>
        <ul>
          <li>Our email delivery provider, used solely to deliver your enquiry to our team</li>
          <li>Our website hosting and database providers, who store the website's data</li>
        </ul>

        <h2>Data retention</h2>
        <p>
          We retain enquiry information for as long as reasonably necessary
          to respond to your request and maintain records of business
          correspondence, after which it may be deleted.
        </p>

        <h2>Your rights</h2>
        <p>
          Under the PDPA, you may request access to, or correction of,
          personal data we hold about you, or withdraw your consent to our
          use of it. To make such a request, please contact us using the
          details below.
        </p>

        <h2>Cookies</h2>
        <p>
          This website may use cookies or similar technologies for basic
          website analytics, to help us understand how visitors use our
          site. These do not identify you personally.
        </p>

        <h2>Contact us</h2>
        <p>
          If you have any questions about this policy or how your personal
          data is handled, please contact us at{" "}
          <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>.
        </p>
      </main>
      <Footer settings={settings} />
    </>
  );
}
