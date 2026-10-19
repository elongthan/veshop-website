import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EnquiryClient from "@/components/EnquiryClient";
import { getSettings } from "@/lib/data";

// Saved copy of this page, refreshed at most every 5 minutes (and straight away when
// something is saved in admin) — avoids rebuilding the page on every visit.
export const revalidate = 300;

export const metadata = {
  title: "Your enquiry list",
  robots: { index: false, follow: true }
};

export default async function EnquiryPage() {
  const settings = await getSettings();
  return (
    <>
      <Header settings={settings} />
      <main className="ve-simple-page">
        <h1>Your enquiry list</h1>
        <p className="ve-muted">Collect the items you're interested in, then send one enquiry for all of them.</p>
        <EnquiryClient whatsappNumber={settings.whatsapp_number} />
      </main>
      <Footer settings={settings} />
    </>
  );
}
