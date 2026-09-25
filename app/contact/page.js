import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with VeShop — Vertex Enterprise Pte Ltd for quotes, orders and enquiries."
};

export default async function ContactPage({ searchParams }) {
  const settings = await getSettings();
  const params = (await searchParams) || {};
  const productName = typeof params.product === "string" ? params.product.slice(0, 200) : "";
  const sku = typeof params.sku === "string" ? params.sku.slice(0, 60) : "";
  const defaultMessage = productName
    ? `Hi, I'd like to enquire about: ${productName}${sku ? ` (SKU: ${sku})` : ""}\n\n`
    : "";

  return (
    <>
      <Header settings={settings} />
      <main className="ve-simple-page">
        <h1>Contact Us</h1>
        <p className="ve-muted">Send us an enquiry using the form and we'll get back to you, or call or WhatsApp us directly.</p>
        <div className="ve-contact-grid">
          <ContactForm defaultMessage={defaultMessage} />
          <div className="ve-contact-info">
            <div>
              <h4>Phone</h4>
              <p>{settings.phone1}{settings.phone2 ? <><br />{settings.phone2}</> : null}</p>
            </div>
            <div>
              <h4>Address</h4>
              <p style={{ whiteSpace: "pre-line" }}>{settings.footer_address}</p>
            </div>
            {settings.footer_address && (
              <div className="ve-contact-map">
                <iframe
                  title="Our location"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(settings.footer_address)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
