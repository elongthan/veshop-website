export default function Footer({ settings }) {
  const siteName = settings?.site_name || "VESHOP";
  const tagline = settings?.site_tagline || "Vertex Enterprise catalog";
  const address = settings?.footer_address || "";
  const phone1 = settings?.phone1 || "";
  const phone2 = settings?.phone2 || "";
  const email = settings?.contact_email || "sales@veshop.com.sg";

  return (
    <footer className="ve-footer">
      <div className="ve-footer-grid">
        <div>
          <div className="ve-logo-text" style={{ marginBottom: 10 }}>
            <strong>{siteName}</strong>
            <em>{tagline}</em>
          </div>
          <p className="ve-muted" style={{ whiteSpace: "pre-line" }}>{address}</p>
        </div>
        <div>
          <h4>Get in touch</h4>
          <p className="ve-muted">
            {phone1}{phone2 ? <><br />{phone2}</> : null}<br />
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
