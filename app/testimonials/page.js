import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/data";
import { Star } from "lucide-react";

export const revalidate = 300;

export const metadata = {
  title: "Customer Reviews",
  description: "See what customers say about Vertex Enterprise (VeShop) on Google, or leave us a review.",
  alternates: { canonical: "https://www.veshop.com.sg/testimonials" }
};

const WRITE_REVIEW_URL = "https://g.page/r/CUT3lOqIbUxsEBM/review";
const READ_REVIEWS_URL = "https://www.google.com/search?q=Vertex+Enterprise+Pte+Ltd+reviews";

export default async function TestimonialsPage() {
  const settings = await getSettings();

  return (
    <>
      <Header settings={settings} />
      <main className="ve-simple-page">
        <h1>Customer Reviews</h1>
        <p className="ve-about-text">
          Our customers' feedback is shared on Google, so you can read it exactly as they wrote it.
          Bought from us before? We would be grateful for a few words about your experience.
        </p>
        <div style={{ display: "flex", gap: 6, margin: "18px 0 22px" }} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={26} fill="#F5B301" color="#F5B301" />
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <a className="ve-btn ve-btn-primary" href={READ_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
            Read our Google reviews
          </a>
          <a className="ve-btn" href={WRITE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
            Leave us a review
          </a>
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
