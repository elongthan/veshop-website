export default function Footer() {
  return (
    <footer className="ve-footer">
      <div className="ve-footer-grid">
        <div>
          <div className="ve-logo-text" style={{ marginBottom: 10 }}>
            <strong>VESHOP</strong>
            <em>Vertex Enterprise catalog</em>
          </div>
          <p className="ve-muted">
            9003 Tampines Street 93, #03-158<br />
            Tampines Industrial Park A<br />
            Singapore 528837
          </p>
        </div>
        <div>
          <h4>Get in touch</h4>
          <p className="ve-muted">+65 8363 1218<br />+65 6980 8669<br />sales@veshop.com.sg</p>
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
