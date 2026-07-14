"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toggleShowPrices } from "@/actions/products";

export default function SettingsClient({ initialShowPrices }) {
  const [showPrices, setShowPrices] = useState(initialShowPrices);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setSaving(true);
    const next = !showPrices;
    await toggleShowPrices(next);
    setShowPrices(next);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="ve-settings">
      <h2>Site settings</h2>
      <div className="ve-toggle-row">
        <div>
          <strong>Show prices on website</strong>
          <p className="ve-muted">When off, shoppers see "Price on request" instead of item prices across the whole site.</p>
        </div>
        <button
          className={`ve-toggle ${showPrices ? "on" : ""}`}
          onClick={handleToggle}
          disabled={saving}
          aria-pressed={showPrices}
        >
          <span className="ve-toggle-thumb" />
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        {showPrices ? (
          <span className="ve-badge ve-badge-success"><Eye size={13} /> Prices are visible</span>
        ) : (
          <span className="ve-badge ve-badge-warning"><EyeOff size={13} /> Prices are hidden</span>
        )}
      </div>
    </div>
  );
}
