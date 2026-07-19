"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { downloadCatalogPdf } from "@/lib/generatePdf";

export default function PrintCatalogButton({ products, categoryLabel, showPrices, settings }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await downloadCatalogPdf({ products, categoryLabel, showPrices, settings });
    } catch (e) {
      alert("Could not generate the PDF right now. Please try again.");
    }
    setLoading(false);
  }

  return (
    <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={handleClick} disabled={loading}>
      <Printer size={15} /> {loading ? "Preparing PDF..." : "Download catalog (PDF)"}
    </button>
  );
}
