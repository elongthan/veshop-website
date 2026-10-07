"use client";

import Link from "next/link";
import { MessageCircle, Trash2 } from "lucide-react";
import useEnquiryList from "./useEnquiryList";
import ContactForm from "./ContactForm";
import { removeItem, setQty, clearItems, buildEmailMessage, buildWhatsAppUrl } from "@/lib/enquiryList";

export default function EnquiryClient({ whatsappNumber }) {
  const items = useEnquiryList();

  if (!items.length) {
    return (
      <div className="ve-enquiry-empty">
        <p>Your enquiry list is empty.</p>
        <p className="ve-muted">Open any product and press "Add to enquiry list" to collect items, then send them all in one enquiry.</p>
        <Link href="/shop" className="ve-btn ve-btn-primary">Browse the catalogue</Link>
      </div>
    );
  }

  const waUrl = buildWhatsAppUrl(whatsappNumber, items);

  return (
    <div className="ve-enquiry-grid">
      <div>
        <ul className="ve-enquiry-items">
          {items.map((i) => (
            <li key={i.id}>
              <div className="ve-enquiry-item-info">
                <Link href={`/product/${i.id}`}>{i.name}</Link>
                {i.sku && <span className="ve-muted"> SKU: {i.sku}</span>}
              </div>
              <input
                type="number" min="1" max="9999" value={i.qty}
                aria-label={`Quantity for ${i.name}`}
                onChange={(e) => setQty(i.id, e.target.value)}
              />
              <button type="button" className="ve-enquiry-remove" aria-label={`Remove ${i.name}`} onClick={() => removeItem(i.id)}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="ve-btn ve-btn-ghost ve-btn-sm" onClick={() => { if (confirm("Clear your whole enquiry list?")) clearItems(); }}>
          Clear list
        </button>
        {waUrl && (
          <p style={{ marginTop: 16 }}>
            <a className="ve-btn ve-whatsapp-btn" href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={16} /> Send this list on WhatsApp
            </a>
          </p>
        )}
      </div>
      <div>
        <h3 style={{ marginBottom: 10 }}>Or send by email</h3>
        <ContactForm defaultMessage={buildEmailMessage(items)} syncMessage onSent={clearItems} />
      </div>
    </div>
  );
}
