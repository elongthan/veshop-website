import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/data";
import { MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us",
  description: "About Vertex Enterprise Pte Ltd — hardware, PPE and safety supplies in Singapore."
};

export default async function AboutPage() {
  const settings = await getSettings();
  const waNumber = (settings.whatsapp_number || "").replace(/[^0-9]/g, "");

  return (
    <>
      <Header settings={settings} />
      <main className="ve-simple-page">
        <h1>About Us</h1>
        <p className="ve-about-text">{settings.about_us_text}</p>
        {waNumber && (
          <a className="ve-btn ve-btn-primary ve-whatsapp-btn" href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={16} /> Chat with us on WhatsApp
          </a>
        )}
      </main>
      <Footer settings={settings} />
    </>
  );
}
