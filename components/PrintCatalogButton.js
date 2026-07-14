"use client";

import { Printer } from "lucide-react";

export default function PrintCatalogButton() {
  return (
    <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={() => window.print()}>
      <Printer size={15} /> Download catalog (PDF)
    </button>
  );
}
