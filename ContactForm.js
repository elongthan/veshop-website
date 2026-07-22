"use client";

import { useState } from "react";
import { sendContactEnquiry } from "@/actions/site";

export default function ContactForm({ contactEmail }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    const formData = new FormData(e.target);

    const result = await sendContactEnquiry(formData);

    if (result.ok) {
      setStatus("sent");
      e.target.reset();
      return;
    }

    if (result.fallback) {
      // No email service configured yet — open the visitor's own email app instead
      const name = formData.get("name");
      const email = formData.get("email");
      const message = formData.get("message");
      const subject = encodeURIComponent(`Website enquiry from ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
      setStatus("idle");
      return;
    }

    setStatus("error");
    setErrorMsg(result.error || "Something went wrong. Please try again.");
  }

  if (status === "sent") {
    return (
      <div className="ve-form-success">
        <strong>Thanks — your message has been sent.</strong>
        <p className="ve-muted">We'll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form className="ve-contact-form" onSubmit={handleSubmit}>
      <div className="ve-form-row">
        <div>
          <label className="ve-filter-label">Name *</label>
          <input name="name" required />
        </div>
        <div>
          <label className="ve-filter-label">Email *</label>
          <input name="email" type="email" required />
        </div>
      </div>
      <label className="ve-filter-label">Phone</label>
      <input name="phone" />
      <label className="ve-filter-label">Message *</label>
      <textarea name="message" rows={5} required />
      {status === "error" && <div className="ve-form-error">{errorMsg}</div>}
      <button className="ve-btn ve-btn-primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}
