import { MessageCircle } from "lucide-react";

export default function Footer({ settings }) {
  const siteName = settings?.site_name || "VESHOP";
  const address = settings?.footer_address || "";
  const phone1 = settings?.phone1 || "";
  const phone2 = settings?.phone2 || "";
  const email = settings?.contact_email || "sales@veshop.com.sg";
  const waNumber = (settings?.whatsapp_number || "").replace(/[^0-9]/g, "");

  return (
    <footer className="ve-footer">
      <div className="ve-footer-grid">
        <div>
          <div className="ve-logo-text" style={{ marginBottom: 10 }}>
            <strong>{siteName}</strong>
          </div>
          <p className="ve-muted" style={{ whiteSpace: "pre-line" }}>{address}</p>
        </div>
        <div>
          <h4>Get in touch</h4>
          <p className="ve-muted">
            {waNumber ? (
              <a className="ve-footer-whatsapp" href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={14} /> {phone1}
              </a>
            ) : (
              phone1
            )}
            {phone2 ? <><br />{phone2}</> : null}<br />
            {email}
          </p>
        </div>
        <div>
          <h4>Catalog</h4>
          <p className="ve-muted">Browse categories, search by brand, filter by price. Prices shown are GST-inclusive where visible.</p>
        </div>
      </div>
      <div className="ve-footer-bottom">
        © {new Date().getFullYear()} Vertex Enterprise Pte Ltd. Catalog site — no online payment.
      </div>
    </footer>
  );
}
