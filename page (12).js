import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with VeShop — Vertex Enterprise Pte Ltd for quotes, orders and enquiries."
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <>
      <Header settings={settings} />
      <main className="ve-simple-page">
        <h1>Contact Us</h1>
        <p className="ve-muted">Send us an enquiry and we'll get back to you, or reach us directly.</p>
        <div className="ve-contact-grid">
          <ContactForm contactEmail={settings.contact_email} />
          <div className="ve-contact-info">
            <div>
              <h4>Email</h4>
              <p><a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></p>
            </div>
            <div>
              <h4>Phone</h4>
              <p>{settings.phone1}{settings.phone2 ? <><br />{settings.phone2}</> : null}</p>
            </div>
            <div>
              <h4>Address</h4>
              <p style={{ whiteSpace: "pre-line" }}>{settings.footer_address}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
